import {FileSaver, ProcessHandler} from "./process";
import {startDb} from "./db";
import {dataDir, outputDir} from "./fileLocations";
import path from "path";
import fs from "fs-extra";
import _ from "lodash";
import {InputItem, ProcessingItem} from "./process/shared-types";


interface QueueItem {
    id: string
    lastRequestTime: number
    input: InputItem
    processing: boolean
    progress: number
    error?: any
    output?: any
}

export interface ProcessingHandler {
    subscribe: (listener: Listener) => () => void
    enqueue: (input: InputItem) => ProcessingItem
    remove: (p: {incomplete?: boolean, failed?: boolean})=>void
    get: (id: string) => ProcessingItem
    stats: Stats
}

interface Stats {
    queueDepth: number
    errors: number
}

type Listener = {
    itemChanged: (processingItem: ProcessingItem) => void
    itemRemoved: (id:string)=>void
    statsChanged: (stats: Stats) => void
}

type FileLocation = {
    access: string
    stored: string
}

function queueToProcessing(item: QueueItem): ProcessingItem {
    return _.pick(item, ['id', 'input', 'output', 'error', 'processing', 'progress', 'type']) as ProcessingItem
}

export function startProcessingHandler({handlers}: { handlers: Record<string, ProcessHandler<any, any, any>> }): ProcessingHandler {
    const stats = {
        queueDepth: 0,
        errors: 0
    }
    let db = startDb<QueueItem>(path.join(dataDir, 'db.json'));


    function getFileLocation(name: string, fileType: string): FileLocation {
        let date = new Date().toISOString().substring(0, 10);
        let fileName = name + fileType;
        let access = [date, fileName].join('/');
        let stored = path.join(outputDir, date, fileName)
        return {
            access,
            stored
        }
    }

    const saver: FileSaver = {
        async saveBase64(name, data) {
            let location = getFileLocation(name, '.png');
            const base64Data = data.replace(/^data:image\/png;base64,/, "");
            await fs.outputFile(location.stored, base64Data, 'base64');
            return location.access
        },
        async saveJson(name, data) {
            let location = getFileLocation(name, '.json');
            await fs.outputJSON(location.stored, data, {spaces: 2});
            return location.access
        }
    }


    async function next() {
        const queue = db.allValues()
            .filter(item => !item.output && !item.error)
        const errors = db.allValues()
            .filter(item => item.error)

        if(stats.queueDepth !== queue.length || errors.length !== stats.errors) {
            stats.queueDepth = queue.length
            stats.errors = errors.length

            allListeners.statsChanged(stats)

        }
        return queue[0]
    }

    const listeners: Listener[] = []
    const allListeners: Listener = {
        itemChanged(item){
            for (const listener of listeners) {
                listener.itemChanged(item)
            }
        },
        itemRemoved(id){
            for (const listener of listeners) {
                listener.itemRemoved(id)
            }
        },
        statsChanged(stats){
            for (const listener of listeners) {
                listener.statsChanged(stats)
            }
        }
    }

    function change(id: string, change: Partial<QueueItem>) {
        const newObj = {...db.get(id), ...change}
        db.set(id, newObj)
        const external = queueToProcessing(newObj)

        allListeners.itemChanged(external)

    }

    let isProcessing = false

    async function doProcessing() {
        if (isProcessing){
            await next();
            return
        }

        isProcessing = true

        do {
            let n = await next();
            if (!n)
                break;

            console.log(n.input.prompt)

            change(n.id, {processing: true})
            const handler = handlers[n.input.type]
            try {

                let result = await handler.implementation.execute({...n.input}, (progress) => {
                    change(n.id, {progress})
                });
                const output = await handler.handleResult(n.input, result, saver)
                change(n.id, {progress: 100, processing: false, output})
            } catch (e: any) {
                console.error(e)
                change(n.id, {processing: false, error: e.message})
            }
        } while (true)
        isProcessing = false
    }

    doProcessing()


    return {
        subscribe(listener: Listener) {
            listeners.push(listener)
            return () => {
                _.remove(listeners, l => l === listener)
            }
        },
        enqueue(input: InputItem) {
            let handler = handlers[input.type];
            const id = handler.makeId(input)
            let item = db.get(id);
            if (!item || item.error) {
                item = {id, input, processing: false, progress: 0, lastRequestTime: Date.now()};
                db.set(id, item)
                doProcessing()
            } else {
                item = {...item, lastRequestTime: Date.now()}
                db.set(id, item)
            }
            return queueToProcessing(item)
        },
        remove(p){
            const queue = db.allValues()
                .filter(item => p.incomplete && !item.output && !item.error || p.failed && !item.output && item.error)
            for (const queueItem of queue) {
                db.delete(queueItem.id)
                stats.errors = 0
                allListeners.statsChanged(stats)
                allListeners.itemRemoved(queueItem.id)

            }
        },
        get: (id) => {
            return queueToProcessing(db.get(id))
        },
        stats
    }
}
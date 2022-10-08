import {WebSocketServer} from "ws";
import {ProcessingHandler} from "./process-handler";

export function startSocketServer(processing: ProcessingHandler) {
    const wss = new WebSocketServer({
        port: 4001,
    });

    console.log('Socket listening on ws://localhost:4001/');

    wss.on('connection', function connection(ws) {
        const subscriptions: Record<string, boolean> = {}

        function sendJson(json: any) {
            ws.send(JSON.stringify(json))
        }

        sendJson({stats: processing.stats})
        const unsubscribe = processing.subscribe({
            itemChanged: (item) => {
                if (subscriptions[item.id]) {
                    sendJson({items: {[item.id]: item}})
                }
            },
            itemRemoved: (id) => {
                if (subscriptions[id]) {
                    sendJson({removed: id})
                }
            },
            statsChanged: (stats)=>sendJson({stats})
        })

        ws.on('message', async function message(data) {
            let message = JSON.parse(data.toString());
            if (message.subscribe) {
                const response: any = {}
                for (const id of message.subscribe) {
                    subscriptions[id] = true
                    response[id] = processing.get(id)
                }
                sendJson({items: response})
            }
        });

        ws.on('close', async function closed() {
            unsubscribe()
        })

    });

}

import fs from 'fs-extra'

interface Db<T> {
    get(key: string): T

    set(key: string, value: T): void

    delete(key: string): void

    all(): Record<string, T>

    allKeys(): string[]

    allEntries(): [string, T][]

    allValues(): T[]
}

export function startDb<T>(jsonFile: string): Db<T> {
    let data: Record<string, any> = {}
    let saveTimeout: any = undefined

    async function save() {
        await fs.outputJson(jsonFile, data)
        saveTimeout = undefined
    }

    try {
        data = fs.readJsonSync(jsonFile);
    } catch (e) {
        save()
    }

    return {
        get(key) {
            return data[key]
        },
        set(key, value) {
            data[key] = value
            if (!saveTimeout) {
                saveTimeout = setTimeout(save, 1000)
            }
        },
        delete(key) {
            delete data[key]
            if (!saveTimeout) {
                saveTimeout = setTimeout(save, 1000)
            }
        },
        all() {
            return data
        },
        allKeys() {
            return Object.keys(data)
        },
        allEntries(): [string, T][] {
            return Object.entries(data)
        },
        allValues(): T[] {
            return Object.values(data)
        },
    }
}
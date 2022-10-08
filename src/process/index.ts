import {Img2ImgInput, Sampler, Txt2ImgInput, Txt2ImgOutput,} from "./shared-types";

type ProgressListener = (progress: number) => void

export interface ProcessImpl<IN, RES> {
    execute(input: IN, listener: ProgressListener): Promise<RES>
}

export interface ProcessImplWithCaps<CAPS, IN, RES> extends ProcessImpl<IN, RES>{
    capabilities: CAPS
}

export interface ProcessHandler<IN, RES, OUT> {
    implementation: ProcessImpl<IN, RES>,
    makeId: (input: IN) => string
    handleResult: (input: IN, result: RES, saver: FileSaver) => Promise<OUT>
}

interface X2ImgCaps{
    samplers: Sampler[]
    negativePrompt?: boolean,
    tiling?: boolean
}

export interface Txt2ImgResult {
    result: string // image base64
    // time per step
    // total time?
}

export interface Img2ImgResult {
    result: string // image base64
    // time per step
    // total time?
}


export type Txt2ImgProcess = ProcessImplWithCaps<X2ImgCaps, Txt2ImgInput, Txt2ImgResult>
export type Img2ImgProcess = ProcessImplWithCaps<X2ImgCaps, Img2ImgInput, Img2ImgResult>


export interface FileSaver {
    saveJson(name: string, data: any): Promise<string>
    saveBase64(name: string, data: string): Promise<string>
}

export function txt2imgHandler(implementation: Txt2ImgProcess): ProcessHandler<Txt2ImgInput, Txt2ImgResult, Txt2ImgOutput> {
    return {
        implementation,
        async handleResult(input, result, saver) {
            let name = "result" + Date.now() +"_"+ Math.floor(Math.random() * 10000);
            await saver.saveJson(name, input)
            return {
                result: await saver.saveBase64(name, result.result),
            }
        },

        makeId(i: Txt2ImgInput): string {
            let obj : any = i
            let fields = Object.keys(obj);
            fields.sort()

            return fields.map(field => `${field}_${obj[field]}`).join("_")
        }
    }
}


import fetch from "node-fetch";
import {Img2ImgProcess, Txt2ImgProcess} from "../index";
import _ from "lodash";

const url = "http://localhost:7860"

async function toBackend(data: any): Promise<any> {
    let response = await fetch(url+'/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json()
}


interface FunctionDef {
    fn_index:number,
    defaultData: any[],
    dataIndexLookup : Record<string, number>
}

const functions : Record<string, FunctionDef> = {}

function hasAll(obj: any, keys: string[]){
    for (const key of keys) {
        if(obj[key]===undefined)
            return false
    }
    return true
}

export async function a1111_txt2img_init(){
    let configUrl = url+'/config';
    console.log("Loading AUTOMATIC1111 config from: " + configUrl)
    let response = await fetch(configUrl);
    let config :any = await response.json()
    const components = _.keyBy(config.components, 'id')
    for (let i = 0; i < config.dependencies.length; i++) {
        const dependency = config.dependencies[i];

        const func : FunctionDef= {
            fn_index: i,
            defaultData: [],
            dataIndexLookup: {}
        }


        for (const inputId of dependency.inputs) {
            let inputData = components[inputId].props;
            func.dataIndexLookup[inputData.label?.toLowerCase()||''] = func.defaultData.length
            func.defaultData.push(inputData.value)
        }

        if(hasAll(func.dataIndexLookup, ["prompt","cfg scale","sampling steps", "seed", "negative prompt", "seeds"]))
        {
            if(func.dataIndexLookup['image for img2img']){
                functions['img2img'] = func
            }
            else {
                functions['txt2img'] = func
            }

        }
    }
    if(!functions['img2img'])
        throw Error("No img2img function found")
    if(!functions['txt2img'])
        throw Error("No txt2img function found")
    return
}

export const a1111_txt2img: Txt2ImgProcess = {
    capabilities: {
        samplers: ['Euler a', 'Euler', 'LMS', 'Heun', 'DPM2', 'DPM2 a', 'DDIM', 'PLMS'],
        negativePrompt: true,
        tiling: true,
    },

    async execute(input, listener) {
        let functionDef = functions['txt2img']!
        let data = [...functionDef.defaultData]
        function setData(label: string, value:any){
            data[functionDef.dataIndexLookup[label]] = value
        }

        setData("prompt", input.prompt)
        setData("negative prompt", input.negativePrompt)
        setData("sampling steps", input.steps)
        setData("sampling method", input.sampler)
        setData("cfg scale", Number(input.cfg))
        setData("tiling", input.tiling)
        setData("width", input.width)
        setData("height", input.height)
        setData("script", 'Advanced Seed Blending')
        setData("seeds", input.seed)

        let request = {
            "fn_index": functionDef.fn_index,
            "data": data,
            "session_hash": "1234"
        };
        // console.log(JSON.stringify(request, null, 2))
        const result = await toBackend(
            request
        )
        let resultData = result.data?.[0]?.[0];
        if(!resultData)
            throw Error("No result!")
        return {
            result: {type:'url', url: url+'/file=' + resultData.name }
        }
    }
}

export const a1111_img2img: Img2ImgProcess = {
    capabilities:{
        samplers: ["LMS", "DDIM"],
        negativePrompt: true,
        tiling: true,
    },

    async execute(request, listener) {
        return {result: {type:'url', url: "the image"}}
    }
}


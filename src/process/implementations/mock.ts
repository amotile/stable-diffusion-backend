import fetch from "node-fetch";
import fs from "fs-extra";
import {Img2ImgProcess, Txt2ImgProcess} from "../index";


export function wait(t:number){
    return new Promise((resolve)=>{
        setTimeout(resolve, t)
    })
}

export const mock_txt2img: Txt2ImgProcess = {
    capabilities: {
        samplers: ['Euler a', 'Euler', 'LMS', 'Heun', 'DPM2', 'DPM2 a', 'DDIM', 'PLMS'],
        negativePrompt: true,
        tiling: true,
    },

    async execute(input, listener) {
        if(input.prompt.indexOf("error")>=0){
            throw Error("Bad prompt")
        }
        await wait(1000)
        const options  = ['a', 'b']
        const picked = options[Math.round(Math.random()*options.length)]
        return {
            result: fs.readFileSync(`${__dirname}/mock-${picked}.txt`).toString()
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
        return {result: "the image"}
    }
}


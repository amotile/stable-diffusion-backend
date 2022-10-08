import fetch from "node-fetch";
import {Img2ImgProcess, Txt2ImgProcess} from "../index";

const url = "http://localhost:7860/api/predict"

async function toBackend(data: any): Promise<any> {
    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json()
}


export const a1111_txt2img: Txt2ImgProcess = {
    capabilities: {
        samplers: ['Euler a', 'Euler', 'LMS', 'Heun', 'DPM2', 'DPM2 a', 'DDIM', 'PLMS'],
        negativePrompt: true,
        tiling: true,
    },

    async execute(input, listener) {

        const result = await toBackend(
            {
                "fn_index": 11,
                "data": [
                    input.prompt,
                    "",
                    "None",
                    "None",
                    input.steps,
                    input.sampler,
                    false, // faces
                    input.tiling,
                    1, // # items
                    1, // # in each patch
                    Number(input.cfg),
                    -1,
                    -1,
                    0,
                    0,
                    0,
                    true,
                    input.width,
                    input.height,
                    false,
                    false,
                    0.7,
                    "Advanced Seed Blending",
                    input.seed,
                    false,
                    false,
                    null,
                    "",
                    "Seed",
                    "",
                    "Steps",
                    "",
                    true,
                    false,
                    null,
                    "",
                    ""],
                "session_hash": "1234"
            }
        )
        let resultData = result.data?.[0]?.[0];
        if(!resultData)
            throw Error("No result!")
        return {
            result: resultData
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


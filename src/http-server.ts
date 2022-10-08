import express, {query} from "express";
import {dataDir, outputDir} from "./fileLocations";
import fs from "fs-extra";
import path from "path";
import {ProcessingHandler} from "./process-handler";
import bodyParser from "body-parser";
import cors from "cors";
import _ from "lodash";

const jsonParser = bodyParser.json()

export function startHttpServer(processingHandler: ProcessingHandler) {
    const app = express();

    app.use(cors());

    function resize(path: string) {
        const readStream = fs.createReadStream(path)
        return readStream
    }

    app.get('/image/:imagePath(*)', async (req, res) => {
        res.type('image/png');


        resize(path.join(outputDir, req.params.imagePath))
            .once('error', err => res.sendStatus(404))
            .pipe(res)


    })

    app.post('/enqueue', jsonParser, (req, res) => {
        let body = req.body
        const response: any = []
        for (const input of body) {
            let item = processingHandler.enqueue(input);
            response.push(item)
        }

        res.json(response)
    })
    app.post('/collectImages', jsonParser, (req, res) => {

        const folder = dataDir+'/collected/'
        try {
            fs.rmSync(folder, {recursive:true})
        } catch (e) {
            console.error(e)
        }
        // const folder = dataDir+'/collected/' + new Date().toISOString().replace(/:/g, "_")
        for (let i = 0; i < req.body.length; i++) {
            const path = req.body[i];

            let out = folder+'/frame'+ _.padStart(''+i, 3,'0') + '.png';
            fs.copySync(outputDir+'/'+path, out)
        }

        res.json({folder})
    })
    app.get('/stop', (req, res) => {
        processingHandler.remove({incomplete:true});
        res.json({'yes': 'boss'})
    })
    app.get('/clear', (req, res) => {
        processingHandler.remove({failed:true});
        res.json({'yes': 'boss'})
    })

    app.listen(4000, function () {
        console.log('Server listening on http://localhost:4000/');
    });
}
import {startProcessingHandler} from "./process-handler";
import {startHttpServer} from "./http-server";
import {startSocketServer} from "./socket-server";
import {ProcessHandler, txt2imgHandler} from "./process";
import {a1111_txt2img} from "./process/implementations/automatic1111";
import {mock_txt2img} from "./process/implementations/mock";


const handlers: Record<string, ProcessHandler<any, any, any>> = {
    a1111_txt2img: txt2imgHandler(a1111_txt2img),
    mock_txt2img: txt2imgHandler(mock_txt2img)
}

handlers.txt2img = handlers.a1111_txt2img
// handlers.txt2img = handlers.mock_txt2img


let processingHandler = startProcessingHandler({handlers});

startHttpServer(processingHandler)
startSocketServer(processingHandler)

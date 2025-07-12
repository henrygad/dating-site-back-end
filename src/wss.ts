import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const wss = (server: http.Server, PORT: string) => {   

    const clients = new Map();
    
    const wss = new WebSocketServer({ server });
    
    wss.on("connection", (ws: WebSocket) => {
        console.log("Hi this is WebSocket");

        ws.on("error", (error: Error) => {
           
        });
        
        ws.on("message", (data: Buffer) => {
            console.log("Hi just sent a messgae");
            console.log(data);
        });
       
        ws.on("close", () => {      
            console.log("Hi just closed the WebSocket 1");
        });
    });

    wss.on("close", () => {     
        console.log("Hi just closed the WebSocket 2");
    });

    console.log(`WebSocket running on wss://localhost:${PORT} end point`);
};

export default wss;


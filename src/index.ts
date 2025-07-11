import app from "./app";
import wss from "./wss";
import http from "http";
import "dotenv/config";

const PORT = process.env.PORT || 5000;

const server = http
    .createServer(app)
    .listen(PORT, () => {
        console.log(`Server running on localhost:${PORT} end point`);
        wss(server);
    });    




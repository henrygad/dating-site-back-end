import "dotenv/config";
import app from "./app";
import wss from "./wss";
import http from "http";
import getLocalIP from "./helper/getLocalIP.helper";
import connectDB from "./configs/db.config";

// Get local machine lan ip 
const LAN_IP = getLocalIP();

// Ansign server port number
const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
    try {

        // Start db connection
         await connectDB();

        if (!LAN_IP) {
            console.warn("Local IP not found, falling back to localhost");
        }

        // Start server connection
        const server = http
            .createServer(app)
            .listen(PORT, process.env.NODE_ENV === "development" ? LAN_IP : undefined, () => {

                const SERVER_END_POINT = `${process.env.NODE_ENV === "development" ? LAN_IP : "localhost"}:${PORT}`;

                console.log(`Server running on http${process.env.NODE === "production" ? "s" : ""}://${SERVER_END_POINT}/api end point`);

                // Start websocket server
                wss(server, SERVER_END_POINT);
            });

    } catch (err) {

        console.error("Unkown server error: " + err);

        // End script if db connection or http/wss server fails
        process.exit(1);
    }
};

// Run server
startServer();

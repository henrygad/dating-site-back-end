import app from "./app";
import wss from "./wss";
import http from "http";
import "dotenv/config";
import connectDB from "./configs/db.config";
import getLocalIP from "./helper/getLocalIP";


const LAN_IP = getLocalIP();


const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
    try {

        // await connectDB();

        if (!LAN_IP) {
            console.warn("Local IP not found, falling back to localhost");
        }

        const server = http
            .createServer(app)
            .listen(PORT, process.env.NODE_ENV === "development" ? LAN_IP : undefined, () => {
                const SERVER_END_POINT = `${process.env.NODE_ENV === "development" ? LAN_IP : "localhost"}:${PORT}/api`;

                console.log(`Server running on http://${SERVER_END_POINT} end point`);
                wss(server, SERVER_END_POINT);
            });

    } catch (err) {
        console.error("Unkown server error: " + err);
        process.exit(1);
    }
};

startServer();

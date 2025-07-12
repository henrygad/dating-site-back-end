import app from "./app";
import wss from "./wss";
import http from "http";
import "dotenv/config";
import connectDB from "./configs/db.config";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        /// await connectDB();
        const server = http
            .createServer(app)
            .listen(PORT, () => {
                console.log(`Server running on http://localhost:${PORT} end point`);
                wss(server, PORT as string);
            });
    } catch (err) {
        console.error("Unkown server error: " + err);
        process.exit(1);
    }
};
startServer();

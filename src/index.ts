import app from "./app";
import wss from "./wss";
import http from "http";
import "dotenv/config";
import connectDB from "./db";
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        const server = http
            .createServer(app)
            .listen(PORT, () => {
                console.log(`Server running on localhost:${PORT} end point`);
                wss(server);
            });
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1); // Exit the app immediately
    }
};
startServer();
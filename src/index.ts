import app from "./app";
import wss from "./wss";
import http from "http";
import "dotenv/config";
import connectDB from "./db";
const PORT = process.env.PORT || 5000;

<<<<<<< HEAD
const server = http
    .createServer(app)
    .listen(PORT, () => {
        console.log(`Server running on localhost:${PORT} end point`);
        wss(server);
    });    



=======
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
>>>>>>> 821225ae2df7060fb3f0d2718a9c30f7d7dff326

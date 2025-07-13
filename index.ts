import app from "./src/app";
import wss from "./src/wss";
import http from "http";
import "dotenv/config";
<<<<<<< HEAD:index.ts
import connectDB from "./src/db";
=======
import connectDB from "./configs/db.config";

>>>>>>> 87692721260e68c693c9ed7446c2b47681f0d28f:src/index.ts
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

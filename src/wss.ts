import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import jwt from "jsonwebtoken";

const clients = new Map<WebSocket, { userId: string; roomId?: string; lastPing: number }>();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MESSAGE_LIMIT = 5; // max messages per window
const userMessageCounts = new Map<string, { count: number; timestamp: number }>();

const wss = (server: http.Server, SERVER_END_POINT: string) => {
    const wss = new WebSocketServer({ server });
    console.log(`✅ WebSocket server running on ws://${SERVER_END_POINT}`);

    wss.on("connection", (ws: WebSocket, req) => {
        const token = new URLSearchParams(req.url?.split("?")[1]).get("token");
        if (!token) {
            ws.close(1008, "Authentication token required");
            return;
        }

        let payload: any;
        try {
            payload = jwt.verify(token, "your_secret_key"); // Replace with your real secret
        } catch (err) {
            ws.close(1008, "Invalid or expired token");
            return;
        }

        const userId = payload.id;
        clients.set(ws, { userId, lastPing: Date.now() });
        console.log(`🔐 Authenticated connection: ${userId}`);

        // Ping/pong setup to detect dead connections
        const interval = setInterval(() => {
            const data = clients.get(ws);
            if (!data || Date.now() - data.lastPing > 30000) {
                ws.terminate();
                clients.delete(ws);
                clearInterval(interval);
            }
        }, 10000);

        ws.on("message", (data: Buffer) => {
            let message: any;
            try {
                message = JSON.parse(data.toString());
            } catch {
                ws.send(JSON.stringify({ type: "error", message: "Invalid JSON format" }));
                return;
            }

            const clientData = clients.get(ws);
            if (!clientData) return;

            // Rate limiting
            const rate = userMessageCounts.get(clientData.userId) || { count: 0, timestamp: Date.now() };
            const now = Date.now();
            
            if (now - rate.timestamp < RATE_LIMIT_WINDOW) {
                rate.count++;
                if (rate.count > MESSAGE_LIMIT) {
                    ws.send(JSON.stringify({ type: "error", message: "Rate limit exceeded" }));
                    return;
                }
            } else {
                rate.count = 1;
                rate.timestamp = now;
            }
            userMessageCounts.set(clientData.userId, rate);

            // Message handling
            switch (message.type) {
                case "ping":
                    ws.send(JSON.stringify({ type: "pong" }));
                    clientData.lastPing = Date.now();
                    break;

                case "join_room":
                    clientData.roomId = message.roomId;
                    ws.send(JSON.stringify({ type: "room_joined", roomId: clientData.roomId }));
                    break;

                case "chat_message":
                    for (const [client, data] of clients.entries()) {
                        if (
                            client.readyState === WebSocket.OPEN &&
                            data.roomId === clientData.roomId
                        ) {
                            client.send(JSON.stringify({
                                type: "chat_message",
                                userId: clientData.userId,
                                content: message.content,
                            }));
                        }
                    }
                    break;

                default:
                    ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
            }
        });

        ws.on("close", () => {
            console.log("❎ Disconnected user", clients.get(ws)?.userId);
            clients.delete(ws);
            clearInterval(interval);
        });

        ws.on("error", (error: Error) => {
            console.error("❌ WebSocket error:", error.message);
        });
    });

    wss.on("close", () => {
        console.log("🛑 WebSocket server closed");
    });
};

export default wss;

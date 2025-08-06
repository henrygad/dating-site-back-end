import {
    blockedMessageType,
    chatMessageType,
    errorMessageType,
    pingPongMessageType,
    typingMessageType,
} from "src/types/message.type";
import WebSocket from "ws";
import http from "http";
import verifyJWT from "src/helper/verifyJWT.helper";
import { JwtPayload } from "jsonwebtoken";
import userTypes, { wsUserType } from "src/types/user.type";
import { Types } from "mongoose";

const userMessageTimestamps = new Map<Types.ObjectId, number[]>();

export const authenticateClient = (
    ws: WebSocket,
    req: http.IncomingMessage
) => {
    const token = new URLSearchParams(req.url?.split("?")[1]).get("token");
    if (!token) {
        ws.close(1008, "Authentication token required!");
        return;
    }

    let decoded: JwtPayload | undefined = undefined;
    try {
        decoded = verifyJWT(token);
    } catch {
        ws.close(1008, "Invalid or expired token!");
        return;
    }

    // Fetch user details from db
    const user = {
        _id: decoded?.id as Types.ObjectId
    };

    return user as userTypes;
};

export const updateClientData = (
    ws: WebSocket,
    clients: Map<WebSocket, wsUserType>,
    update: wsUserType
) => {
    const user = clients.get(ws);
    if (user) {
        clients.set(ws, { ...user, ...update });
    } else {
        clients.set(ws, update as wsUserType);
    }
    return clients.get(ws) as wsUserType;
};

export const respond = (
    ws: WebSocket,
    data:
        | pingPongMessageType
        | typingMessageType
        | errorMessageType
        | chatMessageType
        | blockedMessageType
) => {
    ws.send(JSON.stringify(data));
};

export const parseBody = <T>(wsMessage: Buffer): T | null => {
    try {
        return JSON.parse(wsMessage.toString()) as T;
    } catch {
        return null;
    }
};

export const handlePing = (
    ws: WebSocket,
    clients: Map<WebSocket, wsUserType>
) => {
    const interval = setInterval(() => {
        const user = clients.get(ws);

        if (!user) return clearInterval(interval);

        const timeSinceLastPing = Date.now() - user.lastPing;

        // If last ping was more than 30s ago, assume user is offline
        if (timeSinceLastPing > 30000) {
            console.log("⚠️ No ping from user, terminating...");

            updateClientData(ws, clients, {
                ...user,
                isOnline: false,
            });

            clients.delete(ws);
            ws.terminate();
            return clearInterval(interval);
        }

        // ✅ If user is active, send a ping
        if (ws.readyState === ws.OPEN) {
            respond(ws, {
                type: "ping",
                sender: "server",
            });
        }
    }, 20000);

    return interval;
};

export const handlePong = (
    ws: WebSocket,
    clients: Map<WebSocket, wsUserType>
) => {
    // User is still live, update lastPing
    const user = clients.get(ws);
    if (user) {
        updateClientData(ws, clients, { ...user, lastPing: Date.now() });
    }
};

export const exceedRateLimitSlidingWindow = (
    userId: Types.ObjectId,
    {
        RATE_LIMIT_WINDOW,
        MESSAGE_LIMIT,
    }: { RATE_LIMIT_WINDOW: number; MESSAGE_LIMIT: number }
): boolean => {
    const now = Date.now();

    // Get user’s timestamps or initialize empty array
    const timestamps = userMessageTimestamps.get(userId) || [];

    // Filter out timestamps older than window
    const recentTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    // Check if limit exceeded
    if (recentTimestamps.length >= MESSAGE_LIMIT) {
        return true;
    }

    // Add current timestamp
    recentTimestamps.push(now);

    // Save updated timestamps
    userMessageTimestamps.set(userId, recentTimestamps);

    return false;
};

export const cleanUserMessageCounts = () => {
    // Periodically clean up old user message entries after 60s
    setInterval(() => {
        const now = Date.now();
        for (const [userId, timestamps] of userMessageTimestamps.entries()) {
            const recent = timestamps.filter((ts) => now - ts < 60000);
            if (recent.length > 0) {
                userMessageTimestamps.set(userId, recent);
            } else {
                userMessageTimestamps.delete(userId);
            }
        }
    }, 30000);
};

let timeout: NodeJS.Timeout;

export const handleWhenStopTyping = (ws: WebSocket, who_and_where: { user: Types.ObjectId, chat: Types.ObjectId }) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        respond(ws, {
            type: "stop_typing",
            sender: "server",
            who_and_where,
        });
    }, 5000);
};





// function debounce(fn, delay) {
//     let timeout;
//     return (...args) => {
//         clearTimeout(timeout);               // Cancel previous
//         timeout = setTimeout(() => {
//             fn(...args);                       // Only call if no new call comes in
//         }, 5000);
//     };
// }


// function throttle(fn, limit) {
//     let inThrottle = false;
//     return (...args) => {
//         if (!inThrottle) {
//             fn(...args);
//             inThrottle = true;
//             setTimeout(() => {
//                 inThrottle = false;
//             }, 2000);
//         }
//     };
// }


// for (const [client, data] of clients.entries()) {
//     if (
//         client.readyState === WebSocket.OPEN &&
//         data.roomId === clientData.roomId
//     ) {
//         client.send(
//             JSON.stringify({
//                 type: "chat_message",
//                 userId: clientData.userId,
//                 content: message.content,
//             })
//         );
//     }
// }
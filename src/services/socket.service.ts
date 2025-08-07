import messageType, {
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
import { wsUserType } from "src/types/user.type";
import { Types } from "mongoose";
import Message, { IMessage } from "src/models/message.model.";
import User from "src/models/user.model";

const userMessageTimestamps = new Map<Types.ObjectId, number[]>();
let timeout: NodeJS.Timeout;

export const authenticateClient = async (
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
        ws.close(1008, "Invalid or expired jw token!");
        return;
    }

    // Fetch client details from db
    const user = await User.findById(decoded?.id);
    if (!user) {
        ws.close(1008, "Invalid id from jw token: user not found!");
        return;
    }

    // Return client details
    return user.toObject();
};

export const updateClientDataInMemory = (
    ws: WebSocket,
    clients: Map<WebSocket, wsUserType>,
    update: wsUserType
) => {
    let client = clients.get(ws);

    // No Client found in memory
    if (!client) {
        // Store client in momory for the first time
        clients.set(ws, update);
    }
    // Client found
    else {
        // Update client data in momory
        clients.set(ws, { ...client, ...update });
    }

    // Get the update client data
    client = clients.get(ws);

    return client as wsUserType;
};

export const upadetClientOnlineStatInDB = async (
    ws: WebSocket,
    _id: Types.ObjectId,
    { lastPing, isOnline }: { lastPing: number; isOnline: boolean }
) => {
    try {
        await User.findByIdAndUpdate(_id, {
            lastPing,
            isOnline,
        });
    } catch {
        return respond(ws, {
            type: "error",
            sender: "server",
            message: "Faild to updated client lastPing and isOnline!",
        });
    }
};

export const saveMessageToDB = async (
    newMassage: messageType,
    cb: (message: IMessage | null) => void
) => {
    let message = new Message(newMassage);
    message = await message.save();
    if (!message) return cb(null);
    cb(message.toObject());
};

export const updateMessageInDb = async (
    _id: Types.ObjectId,
    update: messageType,
    cb: (message: IMessage | null) => void
) => {
    const { sender, ...rest } = update;
    const message = await Message.findOneAndUpdate(
        { _id, sender },
        { ...rest },
        { new: true }
    );
    if (!message) return cb(null);
    cb(message.toObject());
};

export const updateDeleteFromMeMessageInDb = async (
    _id: Types.ObjectId,
    sender: Types.ObjectId,
    cb: (message: IMessage | null) => void
) => {
    const message = await Message.findOneAndUpdate(
        { _id, $or: [{ sender }, { reciever: sender }] },
        { $addToSet: { deleteFromMe: sender } },
        { new: true }
    );
    if (!message) return cb(null);
    cb(message.toObject());
};

export const updateMessageStatInDb = async (
    _id: Types.ObjectId,
    update: { reciever: Types.ObjectId, seen?: boolean, read?: boolean },
    cb: (message: IMessage | null) => void
) => {
    const { reciever, seen, read } = update;

    let message = await Message.findOne({ _id, reciever });
    if (!message) return cb(null);

    if (seen) {
        message.seen = true;
    }
    if (read) {
        message.read = true;
    }

    message = await message.save();

    cb(message.toObject());
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
        const client = clients.get(ws);

        if (!client) return clearInterval(interval);

        const timeSinceLastPing = Date.now() - client.lastPing;

        // If last ping was more than 30s ago, assume client is offline, then
        if (timeSinceLastPing > 30000) {
            console.log("⚠️ No ping from client, terminating...");

            // Update client online stat

            // 1) on memory
            updateClientDataInMemory(ws, clients, {
                ...client,
                isOnline: false,
            });

            // 2) on db
            upadetClientOnlineStatInDB(ws, client._id, {
                isOnline: false,
                lastPing: client.lastPing,
            });

            // Kill client connection
            clients.delete(ws);
            ws.terminate();

            return clearInterval(interval);
        }

        // If user is active, send a ping
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
    // Client is still live, update lastPing
    const client = clients.get(ws);
    if (client) {
        updateClientDataInMemory(ws, clients, { ...client, lastPing: Date.now() });
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

export const handleWhenStopTyping = (
    ws: WebSocket,
    who_and_where: { user: Types.ObjectId; chat: Types.ObjectId }
) => {
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

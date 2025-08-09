import messageType, {
    chatMessageType,
    errorMessageType,
    pingPongMessageType,
    typingMessageType,
} from "src/types/message.type";
import WebSocket from "ws";
import http from "http";
import verifyJWT from "src/helper/verifyJWT.helper";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import Message, { IMessage } from "src/models/message.model.";
import User from "src/models/user.model";
import { wsClientType } from "src/types/user.type";

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
    _id: Types.ObjectId,
    clients: Map<Types.ObjectId, wsClientType>,
    update: wsClientType
) => {
    let client = clients.get(_id);

    // No Client found in memory
    if (!client) {
        // Store client in momory for the first time
        clients.set(_id, update);
    }
    // Client found
    else {
        // Update client data in momory
        clients.set(_id, { ...client, ...update });
    }

    // Get the update client data
    client = clients.get(_id);

    return client as wsClientType;
};

export const upadetClientOnlineStatsInDB = async (
    _id: Types.ObjectId,
    { lastPing, isOnline }: { lastPing: number; isOnline: boolean },
    ws: WebSocket
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
    try {
        const message = await Message.findOneAndUpdate(
            { _id, sender },
            { ...rest },
            { new: true }
        );
        if (message) cb(message.toObject());

    } catch {
        cb(null);
    }

};

export const updateDeleteFromMeMessageInDb = async (
    _id: Types.ObjectId,
    sender: Types.ObjectId,
    cb: (message: IMessage | null) => void
) => {
    try {
        const message = await Message.findOneAndUpdate(
            { _id, $or: [{ sender }, { reciever: sender }] },
            { $addToSet: { deleteFromMe: sender } },
            { new: true }
        );
        if (message) cb(message.toObject());
    } catch {
        cb(null);
    }

};

export const updateMessageStatsInDb = async (
    _id: Types.ObjectId,
    update: { reciever: Types.ObjectId; seen?: boolean; read?: boolean },
    cb: (message: IMessage | null) => void
) => {
    const { reciever, seen, read } = update;

    try {
        let message = await Message.findOne({ _id, reciever });

        if (message) {

            if (seen) {
                message.seen = true;
            }
            if (read) {
                message.read = true;
            }

            message = await message.save();

            cb(message.toObject());
        }

    } catch {
        return cb(null);
    }
};

export const respond = (
    ws: WebSocket,
    data:
        | pingPongMessageType
        | typingMessageType
        | errorMessageType
        | chatMessageType
) => {
    ws.send(JSON.stringify(data));
};

export const broadcast = (
    clients: Map<Types.ObjectId, wsClientType>,
    { targetClients }: { targetClients: Types.ObjectId[] },
    message:
        | pingPongMessageType
        | typingMessageType
        | errorMessageType
        | chatMessageType
) => {

    // Broadcast to target client
    targetClients.forEach(_id => {
        const client = clients.get(_id);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });

};

export const parseBody = <T>(wsMessage: Buffer): T | null => {
    try {
        return JSON.parse(wsMessage.toString()) as T;
    } catch {
        return null;
    }
};

export const handlePing = (
    _id: Types.ObjectId,
    clients: Map<Types.ObjectId, wsClientType>
) => {
    const interval = setInterval(async () => {
        const client = clients.get(_id);

        if (!client) return clearInterval(interval);

        const timeSinceLastPing = Date.now() - client.lastPing;

        // If last ping was more than 30s ago, assume client is offline, then
        // update client online stat
        if (timeSinceLastPing > 30000) {            

            // 1) on memory
            updateClientDataInMemory(_id, clients, {
                ...client,
                isOnline: false,
            });

            // 2) on db
            await upadetClientOnlineStatsInDB(
                _id,
                {
                    isOnline: false,
                    lastPing: client.lastPing,
                },
                client.ws
            );

            // Kill client connection
            clients.delete(_id);
            client.ws.terminate();

            return clearInterval(interval);
        }

        // If user is active, send a ping
        if (client.ws.readyState === WebSocket.OPEN) {
            respond(client.ws, {
                type: "ping",
                sender: "server",
            });
        }
    }, 20000);

    return interval;
};

export const handlePong = (
    _id: Types.ObjectId,
    clients: Map<Types.ObjectId, wsClientType>
) => {
    // Client is still live, update lastPing
    const client = clients.get(_id);
    if (client) {
        updateClientDataInMemory(_id, clients, { ...client, lastPing: Date.now() });
    }
};

export const handleWhenStopTyping = (cb: () => void) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        cb();
    }, 5000);
};

export const exceedRateLimitSlidingWindow = (
    _id: Types.ObjectId,
    {
        RATE_LIMIT_WINDOW,
        MESSAGE_LIMIT,
    }: { RATE_LIMIT_WINDOW: number; MESSAGE_LIMIT: number }
): boolean => {
    const now = Date.now();

    // Get user’s timestamps or initialize empty array
    const timestamps = userMessageTimestamps.get(_id) || [];

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
    userMessageTimestamps.set(_id, recentTimestamps);

    return false;
};

export const cleanUserMessageCounts = () => {
    // Periodically clean up old user message entries after 60s
    setInterval(() => {
        const now = Date.now();
        for (const [_id, timestamps] of userMessageTimestamps.entries()) {
            const recent = timestamps.filter((ts) => now - ts < 60000);
            if (recent.length > 0) {
                userMessageTimestamps.set(_id, recent);
            } else {
                userMessageTimestamps.delete(_id);
            }
        }
    }, 30000);
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


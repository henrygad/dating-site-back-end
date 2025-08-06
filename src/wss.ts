import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import messageType, {
    blockedMessageType,
    chatMessageType,   
    pingPongMessageType,
    typingMessageType,
} from "./types/message.type";
import {
    authenticateClient,
    exceedRateLimitSlidingWindow,
    handlePing,
    handlePong,
    handleWhenStopTyping,
    parseBody,
    respond,
    updateClientData,
} from "./services/socket.service";
import { wsUserType } from "./types/user.type";
import { Types } from "mongoose";

const clients = new Map<WebSocket, wsUserType>();

const wss = (server: http.Server, SERVER_END_POINT: string) => {
    const wss = new WebSocketServer({ server });
    console.log(`✅ WebSocket server running on ws://${SERVER_END_POINT}`);

    wss.on("connection", (ws: WebSocket, req) => {
        // Authenticate client
        const authClient = authenticateClient(ws, req);

        if (!authClient) {
            ws.close(1008, "Authentication client!");
            return;
        }

        // Store client in memory and db
        const user = updateClientData(ws, clients, {
            _id: authClient._id,
            lastPing: Date.now(),
            isOnline: true,
        });

        // Setup up ping to detect dead connections
        const interval = handlePing(ws, clients);

        ws.on("message", (ms: Buffer) => {
            let data = parseBody<
                | pingPongMessageType
                | typingMessageType
                | blockedMessageType
                | chatMessageType
            >(ms); // Parse Json data

            // If json is invalid retrun an error massagae
            if (!data) {
                respond(ws, {
                    type: "error",
                    sender: "server",
                    message: "Invalid JSON format!",
                });

                return;
            }

            // Rate limiting for messages
            if (
                exceedRateLimitSlidingWindow(user._id, {
                    RATE_LIMIT_WINDOW: 10000,
                    MESSAGE_LIMIT: 5,
                })
            ) {
                respond(ws, {
                    type: "error",
                    sender: "server",
                    message: "Rate limit exceeded, (too many messages)!",
                });

                return;
            }

            // Message handling
            switch (data.type) {

                case "pong":
                    handlePong(ws, clients);
                    break;
                
                case "typing":
                    if (!data.who_and_where.chat) {
                        return;
                    }

                    const typing_who_and_where = { user: authClient._id, chat: data.who_and_where.chat };
                    respond(ws, {
                        type: "typing",
                        sender: "server",
                        who_and_where: typing_who_and_where,
                    });

                    handleWhenStopTyping(ws, typing_who_and_where);
                    break;
               
                case "blocked":
                    if (!data.who) {
                        return;
                    }
                    
                    respond(ws, {
                        type: "recieve_blocked",
                        sender: authClient._id,
                        who: data.who,
                    });                  
                    break;

                case "create_message":
                    const { temp_id, reciever, chat, text, files, emoji, gif, createdAt } = data;

                    if (!chat ||
                        !chat.toString().trim()
                    ) {
                        return;
                    }

                    const storeToDB = {
                        sender: authClient._id,
                        reciever,
                        chat,
                        text,
                        files,
                        emoji,
                        gif,
                        sent: true,
                        seen: false,
                        read: false,
                        edited: false,
                        deleteFromEveryone: false,
                        deleteFromMe: [],
                        createdAt,
                    };

                    const recieveFromDB = {
                        _id: new Types.ObjectId(),
                        ...storeToDB,
                    };

                    respond(ws, {
                        type: "recieve_message",
                        temp_id,
                        ...recieveFromDB
                    });
                    break;

                case "edit_text":
                    const {
                        _id: edit_id,
                        text: edit_text,
                    } = data;

                    const edit_storeToDB = {
                        _id: edit_id,
                        sender: authClient._id,
                        text: edit_text,
                        edited: true,
                    };

                    const edit_recieveFromDB = {
                        ...edit_storeToDB,
                    } as messageType;

                    respond(ws, { type: "recieve_message", ...edit_recieveFromDB });

                    break;

                case "delete_from_everyone":
                    const { _id: delete_from_everyone_id } = data;

                    const delete_from_everyon_sendToDB = {
                        _id: delete_from_everyone_id,
                        sender: authClient._id,
                        deleteFromEveryone: true,
                    };

                    const delete_from_everyon_recieveFromDB = {
                        ...delete_from_everyon_sendToDB,
                    } as messageType;

                    respond(ws, {
                        type: "recieve_message",
                        ...delete_from_everyon_recieveFromDB
                    });

                    break;

                case "delete_from_me":
                    const { _id: delete_from_me_id } = data;

                    const sender = authClient._id;

                    const delete_from_me_storeToDB = {
                        _id: delete_from_me_id,
                        sender,
                        deleteFromMe: [sender]
                    };

                    const delete_from_me_recieveFromDB = {
                        ...delete_from_me_storeToDB,
                    } as messageType;

                    respond(ws, {
                        type: "recieve_message",
                        ...delete_from_me_recieveFromDB
                    });
                    break;

                case "seen_messgae":
                    const { _id: seen_messgae_id } = data;

                    const seen_messgae_storeToDB = {
                        _id: seen_messgae_id,
                        seen: true,
                    };

                    const seen_messgae_recieveFromDB = {
                        ...seen_messgae_storeToDB,
                    } as messageType;

                    respond(ws, {
                        type: "recieve_message",
                        ...seen_messgae_recieveFromDB
                    });
                    break;

                case "recieve_message":
                    const { _id: recieve_message_id } = data;

                    const recieve_message_storeToDB = {
                        _id: recieve_message_id,
                        read: true,
                    };

                    const recieve_message_recieveFromDB = {
                        ...recieve_message_storeToDB,
                    } as messageType;

                    respond(ws, {
                        type: "recieve_message",
                        ...recieve_message_recieveFromDB
                    });
                    break;

                default:
                    respond(ws, {
                        type: "error",
                        sender: "server",
                        message: "Unknown message type!",
                    });
            }
        });

        ws.on("close", () => {
            const user = clients.get(ws);
            if (user) {
                console.log("❎ Disconnected user", user._id);

                updateClientData(ws, clients, {
                    ...user,
                    isOnline: false,
                });

                clients.delete(ws);
            }

            clearInterval(interval); // ✅ Stop ping checker
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

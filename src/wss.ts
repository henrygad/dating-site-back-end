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
    saveMessageToDB,
    upadetClientOnlineStatInDB,
    updateClientDataInMemory,
    updateDeleteFromMeMessageInDb,
    updateMessageInDb,
    updateMessageStatInDb,
} from "./services/socket.service";
import { wsUserType } from "./types/user.type";

const clients = new Map<WebSocket, wsUserType>();

const wss = (server: http.Server, SERVER_END_POINT: string) => {
    const wss = new WebSocketServer({ server });
    console.log(`✅ WebSocket server running on ws://${SERVER_END_POINT}`);

    wss.on("connection", async (ws: WebSocket, req) => {
        // Authenticate client
        const authClient = await authenticateClient(ws, req);
        if (!authClient) {
            ws.close(1008, "Authentication faild!");
            return;
        }

        // Store client in memory
        const client = updateClientDataInMemory(ws, clients, {
            _id: authClient._id,
            lastPing: Date.now(),
            isOnline: true,
        });

        // Update client online stat in db
        await upadetClientOnlineStatInDB(ws, client._id, {
            isOnline: client.isOnline,
            lastPing: client.lastPing,
        });

        // Setup up ping to detect dead connections
        const interval = handlePing(ws, clients);

        // On message sent
        ws.on("message", (ms: Buffer) => {

            // Convert Json data to js
            let data = parseBody<| pingPongMessageType | typingMessageType | blockedMessageType | chatMessageType>(ms);           
            if (!data) {
                respond(ws, {
                    type: "error",
                    sender: "server",
                    message: "Invalid JSON format!",
                });
                return;
            }

            // Limiting number of messages sent in 10s to 5 messages
            const exceeded = exceedRateLimitSlidingWindow(client._id, { RATE_LIMIT_WINDOW: 10000, MESSAGE_LIMIT: 5 });
            if ( exceeded) {
                respond(ws, {
                    type: "error",
                    sender: "server",
                    message: "Rate limit exceeded, (too many messages)!",
                });
                return;
            }

            // Message handler
            switch (data.type) {

                case "pong":
                    // Update client stat
                    handlePong(ws, clients);
                    break;

                case "typing":
                    // Notify chat room that this client is typing

                    if (!data.who_and_where.chat) {
                        return;
                    }
                    
                    const typing_who_and_where = {
                        user: authClient._id,
                        chat: data.who_and_where.chat,
                    };

                    respond(ws, {
                        type: "typing",
                        sender: "server",
                        who_and_where: typing_who_and_where,
                    });

                    // Send stop typing notification when user stop typing
                    handleWhenStopTyping(ws, typing_who_and_where);
                    break;

                case "blocked" :
                    // When client block his friend notify friend immidiately
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
                    // Create new message
                    const {temp_id, reciever, chat, text, files, emoji, gif, createdAt } = data;

                    if (!chat || !reciever.toString().trim()) {
                        respond(ws, {
                            type: "error",
                            sender: "server",
                            message: "Invalid chat message sent: chat id and reciever is not found!",
                        });
                        return;
                    }

                    // Format new message data
                    const createNewMessage = {
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
                        createdAt: createdAt || new Date(),
                    };

                    // Save message to db
                    saveMessageToDB(createNewMessage, (message) => {
                        if (!message) {
                            respond(ws, {
                                type: "error",
                                sender: "server",
                                message: "Message was not sent!",
                            });
                            return;
                        }

                        respond(ws, {
                            type: "recieve_message",
                            temp_id,
                            ...message,
                        });
                    });

                    break;

                case "edit_text":
                    // Update edited message text
                    const { _id: edit_id, text: edit_text } = data;

                    if (!edit_id) {
                        respond(ws, {
                            type: "error",
                            sender: "server",
                            message:
                                "Invalid chat message sent: the message _id is not found!",
                        });
                        return;
                    }

                    // Format edited message data
                    const edit_messageText = {
                        sender: authClient._id,
                        text: edit_text,
                        sent: true,
                        seen: false,
                        read: false,
                        edited: true,
                    };

                    // Update in db
                    updateMessageInDb(
                        edit_id,
                        edit_messageText as messageType,
                        (message) => {
                            if (!message) {
                                respond(ws, {
                                    type: "error",
                                    sender: "server",
                                    message: "Message text was not edited!",
                                });
                                return;
                            }

                            respond(ws, { type: "recieve_message", ...message });
                        }
                    );

                    break;

                case "delete_from_everyone":
                    // Delete client message
                    const { _id: delete_from_everyone_id } = data;

                    if (!delete_from_everyone_id) {
                        respond(ws, {
                            type: "error",
                            sender: "server",
                            message:
                                "Invalid chat message sent: the message _id is not found!",
                        });
                        return;
                    }

                    // Upadte in db
                    updateMessageInDb(
                        delete_from_everyone_id,
                        {
                            sender: authClient._id,
                            deleteFromEveryone: true,
                        } as messageType,
                        (message) => {
                            if (!message) {
                                respond(ws, {
                                    type: "error",
                                    sender: "server",
                                    message: "Message was not deleted from everyone!",
                                });
                                return;
                            }

                            respond(ws, { type: "recieve_message", ...message });
                        }
                    );
                    break;

                case "delete_from_me":
                    // Delete message from client
                    const { _id: delete_from_me_id } = data;
                    if (!delete_from_me_id) {
                        respond(ws, {
                            type: "error",
                            sender: "server",
                            message:
                                "Invalid chat message sent: the message _id is not found!",
                        });
                        return;
                    }

                    // Update in Db
                    updateDeleteFromMeMessageInDb(
                        delete_from_me_id,
                        authClient._id,
                        (message) => {
                            if (!message) {
                                respond(ws, {
                                    type: "error",
                                    sender: "server",
                                    message: "Message was not deleted from you!",
                                });
                                return;
                            }

                            respond(ws, { type: "recieve_message", ...message });
                        }
                    );

                    break;

                case "seen_messgae":
                    // Update message seen stat on reciever request
                    const { _id: messgae_stat_seen_id } = data;

                    if(!messgae_stat_seen_id) {
                        respond(ws, {
                            type: "error",
                            sender: "server",
                            message: "Invalid chat message sent: the message _id is not found!",
                        });
                        return;
                    }

                    // Update in db
                    updateMessageStatInDb(
                        messgae_stat_seen_id,
                        { reciever: authClient?._id, seen: true },
                        (message) => {
                            if(!message) {
                                respond(ws, {
                                    type: "error",
                                    sender: "server",
                                    message: "Message seen stat was not updated!",
                                });
                                return;
                            }

                            respond(ws, { type: "recieve_message", ...message });
                         });                   
                    break;

                case "read_message":
                    // Update message read stat on reciever request
                    const { _id: messgae_stat_read_id } = data;

                    if (!messgae_stat_read_id) {
                        respond(ws, {
                            type: "error",
                            sender: "server",
                            message: "Invalid chat message sent: the message _id is not found!",
                        });
                        return;
                    }

                    // Update in db
                    updateMessageStatInDb(
                        messgae_stat_read_id,
                        { reciever: authClient?._id, read: true },
                        (message) => {
                            if (!message) {
                                respond(ws, {
                                    type: "error",
                                    sender: "server",
                                    message: "Message read stat was not updated!",
                                });
                                return;
                            }

                            respond(ws, { type: "recieve_message", ...message });
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

        // On client disconnect
        ws.on("close", () => {
            const client = clients.get(ws);

            // Update client online stat 
            // and delete client from memory
            if (client) {
                console.log("❎ Disconnected client", client._id);                

                // on Memory
                updateClientDataInMemory(ws, clients, {
                    ...client,
                    isOnline: false,
                });

                // on db 
                upadetClientOnlineStatInDB(ws, client._id, {
                    isOnline: false,
                    lastPing: client.lastPing,
                });

                // Delete client from memory
                clients.delete(ws);
            }

            // Stop ping checker
            clearInterval(interval); 
        });

        // On ws server error
        ws.on("error", (error: Error) => {
            console.error("❌ WebSocket error:", error.message);
        });
    });

    // On WSS server error
    wss.on("close", () => {
        console.log("🛑 WebSocket server closed");
    });
};

export default wss;

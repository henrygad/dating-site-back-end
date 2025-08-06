import { HydratedDocument, model, Schema, Types } from "mongoose";
import chatTypes from "src/types/chat.type";

export type IChat = HydratedDocument<chatTypes>;

const chatSchema = new Schema({
    participants: [
        { type: Types.ObjectId, ref: "users" }
    ],
    messages: [{ type: Types.ObjectId, ref: "messages" }],
    lastMessageAt: Date
});

const Chat = model<IChat>("chats", chatSchema);
export default Chat;


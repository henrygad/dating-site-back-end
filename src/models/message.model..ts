import { HydratedDocument, model, Schema, Types } from "mongoose";
import messageType from "src/types/message.type";

export type IMessage = HydratedDocument<messageType>

const messageSchema = new Schema({
    chat: { type: Types.ObjectId, ref: "chats" },
    sender: { type: Types.ObjectId, ref: "users" },    
    reciever: { type: Types.ObjectId, ref: "users" },    
    text: String,
    files: [{ type: String, url: String }],
    emoji: String,
    gif: String,
    edited: { type: Boolean, default: false },
    sent: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    deleteFromEveryone: { type: Boolean, default: false },
    deleteFromMe: { type: Types.ObjectId, default: [], ref: "users" },
    createdAt: Date,
}
);

const Message = model<IMessage>("messages", messageSchema);
export default Message;

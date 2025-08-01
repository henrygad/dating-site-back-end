import { HydratedDocument, model, Schema, Types } from "mongoose";
import messageType from "src/types/message.type";

export type IMessage = HydratedDocument<messageType>

const messageSchema = new Schema({
    messageId: { type: String, unique: true },
    chat: { type: Types.ObjectId, ref: "chats" },
    sender: { type: Types.ObjectId, ref: "users" },
    type: String,
    data: { type: String, data: String },
    sentAt: Date,
    edited: { type: Boolean, default: false },
    sent: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    deleteType: String,
    createdAt: Date,
},
    { _id: false }
);

const Message = model<IMessage>("messages", messageSchema);
export default Message;

import mongoose, { InferSchemaType } from "mongoose";
const { Schema, model, Types, } = mongoose;

const messageSchema = new Schema({
    sender: { type: Types.ObjectId, ref: "User" },
    text: String,
    type: String,
    sentAt: Date,
    read: { type: Boolean, default: false }
}, { _id: false });
//Message type
export type Message = InferSchemaType<typeof messageSchema>;
export default model("messages", messageSchema);
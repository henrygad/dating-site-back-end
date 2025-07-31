import mongoose, { InferSchemaType } from "mongoose";
const { Schema, model, Types } = mongoose;


const chatSchema = new Schema({
    participants: [
        { type: Types.ObjectId, ref: "User" }
    ],
    messages: [{ type: Types.ObjectId, ref: "Message" }],
    lastMessageAt: Date
});
//Chat type
export type Chat = InferSchemaType<typeof chatSchema>;
export default model("chats", chatSchema);

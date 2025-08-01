import { Types } from "mongoose";

interface chatTypes {
    _id: Types.ObjectId
    participants: Types.ObjectId[],
    messages: Types.ObjectId[][],
    lastMessageAt: Date
}

export default chatTypes;

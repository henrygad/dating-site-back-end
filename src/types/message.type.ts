import { Types } from "mongoose";

interface messageType {
    messageId: string,
    chat: Types.ObjectId,
    sender: Types.ObjectId,
    type: string,
    data: { type: "JSON" | "BLOB" | "FORM_DATA", data: string },
    sentAt: Date,
    sent: boolean,
    seen: boolean,
    read: boolean,
    edited: boolean,
    deleteType: "DELETE_FROM_EVERYONE" | "DELETE_FROM_ME",
    createdAt: Date,    
}

export default messageType;

import { Types } from "mongoose";

interface messageType {
    _id?: Types.ObjectId;
    temp_id?: string,
    sender: Types.ObjectId;
    reciever: Types.ObjectId;
    chat: Types.ObjectId;
    text?: string;
    files?: { type: string, url: string }[]
    emoji: string,
    gif: string,
    sent: boolean;
    seen: boolean;
    read: boolean;
    edited: boolean;
    deleteFromEveryone: boolean,
    deleteFromMe: (Types.ObjectId | string)[];
    createdAt: Date;
}

export interface errorMessageType  {
    sender: string;    
    type: "error";
    message: string;
}

export interface pingPongMessageType  {
    sender:  string;    
    type: "ping"| "pong";
}

export interface typingMessageType  {
    sender: string;
    type: "typing" | "stop_typing";
    who_to_in: { who: Types.ObjectId; to: Types.ObjectId, chat: Types.ObjectId };
}

export interface chatMessageType extends messageType {
    type:
    | "create_message"  
    | "recieve_message"
    | "edit_text"    
    | "delete_from_everyone"
    | "delete_from_me"
    | "seen_messgae"
    | "read_message"
}

export default messageType;

import { Types } from "mongoose";

interface messageType {
    temp_id: string,
    _id: Types.ObjectId;
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
    who_and_where: { user: Types.ObjectId; chat: Types.ObjectId };
}
export interface blockedMessageType  {
    sender: Types.ObjectId;
    type: "blocked" | "recieve_blocked";
    who:  Types.ObjectId;
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



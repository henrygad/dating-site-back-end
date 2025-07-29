import { Types } from "mongoose";
import { Chat } from "src/models/chat.model";
import { Message } from "src/models/message.model.";
import { User } from "src/models/user.model";
// type that accounts for mongoDb default id
export type WithId<T> = T & {
    _id: Types.ObjectId
}
//type for functions that produce dtos might update later, any other schema should be added here.
export type toDto<T extends User | Chat | Message> = (T: WithId<T>) => Omit<T, "_id"> & { id: string }

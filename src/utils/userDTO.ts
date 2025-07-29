
import { IUser } from "src/models/user.model";
import { toDto } from "src/types";
// later modify to add chats and messeges before sending
export const produceUserDto: toDto<IUser> = (user) => {
    //exclude adding password hash b4 sending to frontend
    const { passwordHash: _passwordHash, _id, ...rest } = user;
    return { id: _id.toString(), ...rest };
};
// return type discuss next meeting might be needed depending on where we merging details to send to frontend.
export type userDto = ReturnType<typeof produceUserDto>
import { IUser } from "src/models/user.model";

// later modify to add chats and messeges before sending
const cleanUserData = (user: IUser, exclude: string[] = []) => {
    //exclude adding password hash b4 sending to frontend

    const obj = user.toObject() as Record<string, any>;

    exclude.push(
        "passwordHash",
        "__v",
        "resetToken",
        "refreshToken",
        "emailVerificationToken",
        "emailVerificationTokenExpiringdate",
        "isValidPassword",
        "delete",
        "saveChanges",
    );

    for (const field of exclude) {
        delete obj[field] ;
    }

    return obj;
};

// return type discuss next meeting might be needed depending on where we merging details to send to frontend.
export default cleanUserData;


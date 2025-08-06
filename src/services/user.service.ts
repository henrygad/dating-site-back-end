import { Request } from "express";
import cleanUserData from "src/helper/cleanUserData.helper";
import { createCustomError } from "src/middlewares/error.middleware";
import userTypes from "src/types/user.type";

const readUser = async (req: Request) => { 
    return cleanUserData(req.user!);
};
const updatedUser = async (req: Request) => { 
    const user = req.user!;

    const {
        firstName,
        lastName,
        profilePhotos,
    } = req.body as userTypes;

    // Make changes 
    user.firstName = firstName;
    user.lastName = lastName;
    user.profilePhotos = profilePhotos;

    // Save updated to db
    req.user = await user.save();

    return cleanUserData(req.user);
};
const removeUser = async (req: Request) => { 
 const user = req.user!;

    // Delete user data from db
    const result = await user.deleteOne({ _id: user._id });
    if (!result) throw createCustomError({ statusCode: 400, message: "User account was not deleted!" });

    // Get user last infor
    const name = user.firstName || user.username;

    // Logout user
    req.user = undefined;

    return { name };
};


export {
    readUser,
    updatedUser,
    removeUser
};

// User controllers
import { catchAsyncErrorHandler, createCustomError } from "src/middlewares/error.middleware";
import userTypes from "src/types/user.type";
import cleanUserData from "src/utils/cleanUserData";

// Get user
export const getUser = catchAsyncErrorHandler(async (req, res) => {

    if (!req.user) {
        throw createCustomError({ statusCode: 401, message: "Unauthorized: user not login!" });
    }

    res.json({
        success: true,
        message: "Successfully fetched login user",
        user: cleanUserData(req.user),
    });

});

// Update user data
export const updateUser = catchAsyncErrorHandler(async (req, res) => {
    if (!req.user) {
        throw createCustomError({ statusCode: 401, message: "Unauthorized: user not login!" });
    }

    const {
        firstName,
        lastName,
        profilePhotos,
    } = req.body as userTypes;

    // Make changes 
    req.user.firstName = firstName;
    req.user.lastName = lastName;
    req.user.profilePhotos = profilePhotos;

    // Save updated to db
    req.user = await req.user.save();

    res.json({
        success: true,
        messsage: "Successfully updated profile!",
        user: req.user
    });

});

// Delete user data
export const deleteUser = catchAsyncErrorHandler(async (req, res) => {
    if (!req.user) {
        throw createCustomError({ statusCode: 401, message: "Unauthorized: user not login!" });
    }

    // Delete user data from db
    const result = await req.user.deleteOne({ _id: req.user._id });
    if (!result) throw createCustomError({ statusCode: 400, message: "User account was not deleted!" });

    // Get user last infor
    const name = req.user.firstName || req.user.username;

    // Logout user
    req.user = undefined;

    res.json({ success: true, message: `${name}, your account have been successfully delete. We are sad to see you go.` });
});

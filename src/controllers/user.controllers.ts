// User controllers
import { catchAsyncErrorHandler, createCustomError } from "src/middlewares/error.middleware";
import userTypes from "src/types/user.type";
import cleanUserData from "src/utils/cleanUserData";

// Get user
export const getUser = catchAsyncErrorHandler(async (req, res) => {
    const user = req.user!;

    res.json({
        success: true,
        message: "Successfully fetched login user",
        user: cleanUserData(user),
    });

});

// Update user data
export const updateUser = catchAsyncErrorHandler(async (req, res) => {
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

    res.json({
        success: true,
        messsage: "Successfully updated profile!",
        user: req.user
    });

});

// Delete user data
export const deleteUser = catchAsyncErrorHandler(async (req, res) => {
    const user = req.user!;

    // Delete user data from db
    const result = await user.deleteOne({ _id: user._id });
    if (!result) throw createCustomError({ statusCode: 400, message: "User account was not deleted!" });

    // Get user last infor
    const name = user.firstName || user.username;

    // Logout user
    req.user = undefined;

    res.json({ success: true, message: `${name}, your account have been successfully delete. We are sad to see you go.` });
});

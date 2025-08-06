// User controllers
import { catchAsyncErrorHandler } from "src/middlewares/error.middleware";
import { readUser, removeUser, updatedUser } from "src/services/user.service";


// Get user
export const getUser = catchAsyncErrorHandler(async (req, res) => {
    res.json({
        success: true,
        message: "Successfully fetched login user",
        user: readUser(req),
    });
});

// Update user data
export const patchUser = catchAsyncErrorHandler(async (req, res) => {
    const user = await updatedUser(req);
    res.json({
        success: true,
        messsage: "Successfully updated profile!",
        user: user
    });

});

// Delete user data
export const deleteUser = catchAsyncErrorHandler(async (req, res) => {
    const { name } = await removeUser(req);
    res.json({ success: true, message: `${name}, your account have been successfully delete. We are sad to see you go.` });
});

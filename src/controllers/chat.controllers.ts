import { catchAsyncErrorHandler} from "src/middlewares/error.middleware";
import { createChat, readChat, removeChat, updateChat } from "src/services/chats.service";

export const getChats = catchAsyncErrorHandler(async (req, res) => {
    const chats = await readChat(req);
    res.json({
        success: true,
        message: "Sucessfully fetch user chats",
        chats,
    });

});

export const postChat = catchAsyncErrorHandler(async (req, res) => {
    const chat = await createChat(req);

    res.json({
        success: true,
        message: "Successfully created new chat with friend",
        chat,
    });

});

export const patchChat = catchAsyncErrorHandler(async (req, res) => {
    const chat = updateChat(req);

    res.json({
        success: true,
        message: "Successfully added friend to chat",
        chat,
    });

});

export const deleteChat = catchAsyncErrorHandler(async (req, res) => {
    const chat = await removeChat(req);

    res.json({
        success: true,
        message: "Successfully deleted user chat",
        chat,
    });
});


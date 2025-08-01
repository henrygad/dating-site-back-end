import { catchAsyncErrorHandler, createCustomError } from "src/middlewares/error.middleware";
import Chat from "src/models/chat.model";

export const getChats = catchAsyncErrorHandler(async (req, res) => {
    const user = req.user!;

    const chats = await Chat.find({
        participants: user._id
    })
        .sort({ lastMessageAt: -1 })
        .populate({
            path: "messages",
            options: {
                sort: { createdAt: -1 },
                limit: 20
            }
        });

    if (!chats.length) throw createCustomError({ statusCode: 404, message: "This user have no chat!" });

    res.json({
        success: true,
        message: "Sucessfully fetch user chats",
        chats,
    });

});

export const createChat = catchAsyncErrorHandler(async (req, res) => {
    const user = req.user!;
    const { friend } = req.body;

    let chat = new Chat({ participants: [user._id, friend] });
    chat = await chat.save();

    if (!chat) throw createCustomError({ statusCode: 400, message: "Chat was not created!" });

    res.json({
        success: true,
        message: "Successfully created new chat with friend",
        chat,
    });

});

export const updateChat = catchAsyncErrorHandler(async (req, res) => {  
    const { _id, friend } = req.body;

    const chat = await Chat.findByIdAndUpdate(_id, {
        $addToSet: { participants: friend }
    });

    if (!chat) throw createCustomError({ statusCode: 400, message: "Friend was not added to chat!" });

    res.json({
        success: true,
        message: "Successfully added friend to chat",
        chat,
    });

});

export const deleteChat = catchAsyncErrorHandler(async (req, res) => {
    const user = req.user!;
    const { _id } = req.params;

    const chat = await Chat.findByIdAndUpdate(_id, {
        $pull: { participants: user._id }
    });

    if (!chat) throw createCustomError({ statusCode: 400, message: "User chat was not deleted!" });

    res.json({
        success: true,
        message: "Successfully deleted user chat",
        chat,
    });
});

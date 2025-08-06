import { Request } from "express";
import { createCustomError } from "src/middlewares/error.middleware";
import Chat from "src/models/chat.model";

const createChat = async (req: Request) => {
    const user = req.user!;
    const { friend } = req.body;

    let chat = new Chat({ participants: [user._id, friend] });
    chat = await chat.save();

    if (!chat) throw createCustomError({ statusCode: 400, message: "Chat was not created!" });
    return chat;
};

const readChat = async (req: Request) => {
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

    return chats;
};

const updateChat = async (req: Request) => {
    const { _id, friend } = req.body;

    const chat = await Chat.findByIdAndUpdate(_id, {
        $addToSet: { participants: friend }
    });

    if (!chat) throw createCustomError({ statusCode: 400, message: "Friend was not added to chat!" });
    return chat;
};

const removeChat = async (req: Request) => {
    const user = req.user!;
    const { _id } = req.params;

    const chat = await Chat.findByIdAndUpdate(_id, {
        $pull: { participants: user._id }
    });

    if (!chat) throw createCustomError({ statusCode: 400, message: "User chat was not deleted!" });

    return chat;
};

export {
    createChat,
    readChat,
    updateChat,
    removeChat
};

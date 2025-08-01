import { Router } from "express";
import { createChat, deleteChat, getChats, updateChat } from "src/controllers/chat.controllers";

const router = Router();

// Chat route
router.get("/", getChats);
router.post("/", createChat);
router.patch("/", updateChat);
router.delete("/", deleteChat);

export default router;
import { Router } from "express";
import { postChat, deleteChat, getChats, patchChat } from "src/controllers/chat.controllers";

const router = Router();

// Chat route
router.get("/", getChats);
router.post("/", postChat);
router.patch("/", patchChat);
router.delete("/", deleteChat);

export default router;
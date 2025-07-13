import { Router } from "express";

import authRoute from "./auth.route";
import chatRoute from "./chat.route";
import userRoute from "./user.route";
import statusRoute from "./status.route";
import messageRoute from "./message.route";

const router = Router();

// Channel each route into a group
router.use("/auth", authRoute);   // /api/auth/...
router.use("/chat", chatRoute);  // /api/posts/...
router.use("/user", userRoute);  // /api/users/...
router.use("/status", statusRoute);  // /api/status/...
router.use("/message", messageRoute);  // /api/status/...

export default router;

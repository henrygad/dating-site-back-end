import { Router } from "express";

import authRoute from "./auth.route";
import chatRoute from "./chat.route";
import userRoute from "./user.route";
import protectRoute from "src/middlewares/auth.middleware";

const router = Router();

// Channel each route into a group
router.use("/auth", authRoute); // /api/auth/...
router.use("/user", protectRoute, userRoute); // /api/users/...
router.use("/chat", protectRoute, chatRoute); // /api/posts/...

export default router;

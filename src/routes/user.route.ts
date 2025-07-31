import { Router } from "express";
import { deleteUser, getUser, updateUser } from "src/controllers/user.controllers";
import protect from "src/middlewares/auth.middleware";

const router = Router();

// Users route
router.get("/", protect, getUser);
// Run validation on patch for incoming data
router.patch("/", protect, updateUser);
router.delete("/", protect, deleteUser);

export default router;
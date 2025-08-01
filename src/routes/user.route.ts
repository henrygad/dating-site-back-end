import { Router } from "express";
import { deleteUser, getUser, updateUser } from "src/controllers/user.controllers";

const router = Router();

// Users route
router.get("/", getUser);
// Run validation on patch for incoming data
router.patch("/", updateUser);
router.delete("/", deleteUser);

export default router;

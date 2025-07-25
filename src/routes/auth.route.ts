import { Router } from "express";
import { register } from "../controllers/auth.controllers";
import { register_incoming_data } from "src/validators/auth.validator";
import { expressValidatorErrorHandler } from "src/middlewares/error.middleware";


const router = Router();

// Local authentication route
router.post("/register", register_incoming_data, expressValidatorErrorHandler, register);
router.post("/login", () => { });
router.get("/logout", () => { });

export default router;

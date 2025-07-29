// Authentication routes
import { Router } from "express";
import { localLogin, logout, register } from "../controllers/auth.controllers";
import { register_incoming_data, local_login_incoming_data } from "src/validators/auth.validator";
import { expressValidatorErrorHandler } from "src/middlewares/error.middleware";

const router = Router();

// Local authentication routes
router.post("/register", register_incoming_data, expressValidatorErrorHandler, register);
router.post("/login", local_login_incoming_data, expressValidatorErrorHandler, localLogin);
router.get("/logout", logout);

// Google authentication routes

// Facebook authentication rountes

export default router;

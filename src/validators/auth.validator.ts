import { body } from "express-validator";

export const register_incoming_data = [
    body("username")
        .trim()
        .isString().withMessage("Username must be a string").withMessage("Field must be a string")
        .isLength({ min: 6 }).withMessage("Username must be at least 6 characters long.")
        .toLowerCase()
        .escape(),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Email must be a valid email address")
        .toLowerCase()
        .escape(),

    body("password")
        .trim()
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least one number")
        .matches(/[@$!%*?&#^]/).withMessage("Password must contain at least one special character")
        .isStrongPassword().withMessage("Password must meet all strength requirements")
        .escape()
];

export const login = [
    body("identity")
        .trim()
        .isString().withMessage("Field must be a string")
        .escape(),
    body("password")
        .trim()
        .escape()
];
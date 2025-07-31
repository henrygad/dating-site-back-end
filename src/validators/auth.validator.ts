import { body } from "express-validator";

export const register_incoming_data = [
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
        .escape(),

    body("confirmPassword")
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Confirm password does not match password");
            }
            return true;
        })
        .escape()
];


export const local_login_incoming_data = [
    body("identity")
        .trim()
        .isString().withMessage("Field must be a string")
        .escape(),
    body("password")
        .trim()
        .escape()
];
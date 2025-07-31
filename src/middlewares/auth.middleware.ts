// middleware/authMiddleware.ts
import { Request } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { catchAsyncErrorHandler, createCustomError } from "./error.middleware";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface JwtPayload {
    id: string;
}

export const verifyJWTToken = (req: Request): JwtPayload | undefined => {
    const authHeader = req.headers.authorization;
    let decoded: JwtPayload | undefined = undefined;

    // If no bearer was found, then
    if (!authHeader?.startsWith("Bearer ")) {
        throw createCustomError({ statusCode: 401, message: "Unauthorized: No token provided!" });
    }

    // Next, validate jwt token and catch errors durring validation
    try {
        const token = authHeader.split(" ")[1];
        decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
        const error = err as { name: string };

        if (error.name === "TokenExpiredError") {
            throw createCustomError({ statusCode: 401, message: "Unauthorized: Token has expired!" });
        } else if (error.name === "JsonWebTokenError") {
            throw createCustomError({ statusCode: 401, message: "Unauthorized: Invalid token" });
        }

        throw createCustomError({ statusCode: 500, message: `Authentication failed: ${error}` });        
    }

    // Return jwt decoded value
    return decoded;
};

const protectRoute = catchAsyncErrorHandler(async (req, _res, next) => {
   
    // Validate incoming jwt token
    const decoded = verifyJWTToken(req);

    // Find user by id from token
    const user = await User.findById(decoded?.id);
    if (!user) throw createCustomError({ statusCode: 401, message: "Unauthorized: User not found!" });

    // Update req.user object
    req.user = user;

    next(); // Move to the next middlewar
});

export default protectRoute;

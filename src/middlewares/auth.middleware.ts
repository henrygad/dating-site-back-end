// middleware/authMiddleware.ts
import User from "../models/user.model";
import { catchAsyncErrorHandler, createCustomError } from "./error.middleware";
import verifyJWT from "src/helper/verifyJWT.helper";

const protectRoute = catchAsyncErrorHandler(async (req, _res, next) => {
    const authorization = req.headers.authorization;

    // If no bearer was found, then
    if (!authorization?.startsWith("Bearer ")) {
        throw createCustomError({ statusCode: 401, message: "Unauthorized: No token provided!" });
    }

    // Get toke from authorization
    const token = authorization.split(" ")[1];

    // Validate incoming jwt token
    const decoded = verifyJWT(token);

    // Find user by id from token
    const user = await User.findById(decoded?.id);
    if (!user) throw createCustomError({ statusCode: 401, message: "Unauthorized: User not found!" });

    // Update req.user object
    req.user = user;

    next(); // Move to the next middlewar
});

export default protectRoute;

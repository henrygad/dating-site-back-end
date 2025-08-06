import jwt from "jsonwebtoken";
import { createCustomError } from "src/middlewares/error.middleware";

interface JwtPayload {
    id: string;
}

export const verifyJWT = (token: string): JwtPayload | undefined => {

    let decoded: JwtPayload | undefined = undefined;

    // Next, validate jwt token and catch errors durring validation
    try {       
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
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

export default verifyJWT;
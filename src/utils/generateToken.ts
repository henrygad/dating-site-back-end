// Utill to generate jw token
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

const generateToken = (userId: string) => {
    return jwt.sign(
        { id: userId },
        JWT_SECRET,
        {
            expiresIn: "7d", // Token expires in 7 days            
        }
    );
};

export default generateToken;

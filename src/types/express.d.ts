
import { Request } from "express";
import { IUser } from "../models/user.model";

// Extend Express Request interface to include 'user'
declare module "express-serve-static-core" {
    interface Request {
        user?: IUser;
    }
}
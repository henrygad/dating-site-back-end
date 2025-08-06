import { Request } from "express";

const logoutUser =  (req: Request) => {
    // Remove the req.user property
    req.user = undefined;
};

export default logoutUser;

import express from "express";
import { Request, Response } from "express";


const app = express();

interface CustomRequest extends Request {}
interface CustomResponse extends Response {}

app.get("/api", (req: CustomRequest, res: CustomResponse) => {       

    res.json({
        data: "Hi it working"
    });
});

export default app;

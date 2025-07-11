import express from "express";
import { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());


app.post("/api", async (req: Request, res: Response) => {    

    res.json({ data: "Hello World" });
});

export default app;


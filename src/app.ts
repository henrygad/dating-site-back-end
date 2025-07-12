import express, { NextFunction } from "express";
import { Request, Response } from "express";
import cors from "cors";
import errorHandler, { createError } from "./middlewares/error.middleware";
import allApiRoutes from "./routes/index";

// Create express server
const app = express();

// Middleware to handle cross-origin-resources-sharing
const allowedOrigins = [
    process.env.FRONT_END_DOMAIN_NAME,
    process.env.BACK_END_DOMAIN_NAME,
    process.env.FRONT_END_PREVIEW_DOMAIN_NAME,
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

// Parse all coming reques to JSON
app.use(express.json());

// Main api base end point
app.use("/api", allApiRoutes);
app.get("/api", (req: Request, res: Response) => {
    res.json({ data: "Hello World. Welcome to this api base end point"});
});
// Not found route
app.use((req: Request, res: Response, next: NextFunction) => {
    try {
        throw createError({ statusCode: 404, message: "Route not found" });
    } catch (error) {
        next(error);
    }
});

app.use(errorHandler);

export default app;


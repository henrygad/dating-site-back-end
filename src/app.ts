import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import globalErrorHandler, { multerErrorHandler, routeNotFoundErrorHandler } from "./middlewares/error.middleware";
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
    res.json({ data: "Hello World. Welcome to this api base end point" });
});

// File upload error
app.use(multerErrorHandler);

//  Route not found error
app.use(routeNotFoundErrorHandler);

// Send out all error
app.use(globalErrorHandler);

export default app;


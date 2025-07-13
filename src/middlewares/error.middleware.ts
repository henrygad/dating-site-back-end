import { NextFunction, Request, Response } from "express";

interface ErrorWithStatus extends Error {
  statusCode?: number;
  response: {
    data: string
  }
}

// Global Error middleware
const errorHandler = (err: ErrorWithStatus, req: Request, res: Response, next:NextFunction) => {
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  console.error("💥 Error:", {
    status,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
    date: new Date().toISOString(),
    targetUrl: req.originalUrl,
    name: err.name,
    ...(err.response?.data && { details: err.response.data }),
  });

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      target: req.originalUrl,
    },
  });

  next();
};

type catchAsyncProp = (req: Request, res: Response, next: NextFunction) => void
type catchAsyncRV = (req: Request, res: Response, next: NextFunction)=> Promise<void>

// Async error catcher
export const catchAsync = (fn: catchAsyncProp): catchAsyncRV => {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
};

class customError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
};

type createErrorProps = { statusCode: number, message: string }

// To Create custom error
export const createError = ({ statusCode = 500, message = "Internal Server Error" }: createErrorProps): customError => {
  const error = new customError(statusCode, message);
  return error;
};


export default errorHandler;

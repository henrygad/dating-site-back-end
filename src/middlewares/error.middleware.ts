import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { MulterError } from "multer";

export interface ErrorWithStatus extends Error {
  statusCode?: number;
  response: {
    data: string
  }
}

type catchAsyncProp = (req: Request, res: Response, next: NextFunction) => void
type catchAsyncRV = (req: Request, res: Response, next: NextFunction) => Promise<void>

class customError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
};

// For Creating custom errors
export const createCustomError = ({ statusCode = 500, message = "Internal Server Error" }: { statusCode: number, message: string }): customError => {
  const error = new customError(statusCode, message);
  return error;
};

// Async error catcher
export const catchAsyncErrorHandler = (fn: catchAsyncProp): catchAsyncRV => {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch((err: ErrorWithStatus)=> next(err));
};

// Validation error from express validator
export const expressValidatorErrorHandler = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw createCustomError({ message: errors.array()[0].msg, statusCode: 400 });
  }
  next(); // Move to the next handler
};

// Multer errors from uploading files
export const multerErrorHandler = (err: ErrorWithStatus | MulterError, _req: Request, _res: Response, next: NextFunction) => {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      throw createCustomError({ message: "File too large. Max size is 5MB.", statusCode: 413 });
    }
    throw createCustomError({ message: `MulterError: ${err.message}`, statusCode: 400 });
  }

  next(); // Move to the next handler
};

// Global Error middleware for sending out errors
const globalErrorHandler = (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  /*  console.error("💥 Error:", {
     status,
     message,
     stack: (err.stack),
     date: new Date().toISOString(),
     targetUrl: req.originalUrl,
     name: err.name,
     ...(err.response?.data && { details: err.response.data }),
   }); */

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      targetedRoute: req.originalUrl,
    },
  });

  next();
};

export default globalErrorHandler;

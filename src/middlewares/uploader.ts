import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer, { MulterError } from "multer";
import { v2 as cloudinary } from "cloudinary";
import { NextFunction, Request, Response } from "express";
import { ErrorWithStatus } from "./error.middleware";

function uploader() {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: () => {
            return {
                folder: "folder_name",
            };
        },
    });

    return multer({
        storage,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
    });
}
// later switch to specific type of error after creating custom errors
export function uploadErrorHandler(err: ErrorWithStatus | MulterError, req: Request, res: Response, next: NextFunction) {
    if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "File too large. Max size is 5MB." });
        }
        return res.status(400).json({ message: err.message });
    }
    next(err); // to other handler
};

// call upload.array to upload more than 1 image or upload.single for one
export default uploader;

import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";


// File uploader middler
const uploader = () => {
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
};

// call upload.array to upload more than 1 image or upload.single for one
export default uploader;

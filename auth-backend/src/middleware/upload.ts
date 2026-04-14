import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage to use memory instead of disk for Vercel/Serverless compatibility
const storage = multer.memoryStorage();

// File filter for allowed file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow PDFs and images
    const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
    }
};

// Create multer upload instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
});

// Multer field configurations for different roles
export const trainerUploadFields = upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'certificates', maxCount: 5 },
]);

export const instituteUploadFields = upload.fields([
    { name: 'licenseDocument', maxCount: 1 },
]);

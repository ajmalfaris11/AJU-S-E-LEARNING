import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";

// Function to handle course uploads
export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body; // Extract course data from request body
        const thumbnail = data.thumbnail; // Extract thumbnail from course data

        if (thumbnail) {
            // Upload thumbnail to Cloudinary under the 'courses' folder
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            // Attach Cloudinary upload details to the course data
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }

        // Call the createCourse function to save the course data to the database
        createCourse(data, res, next);

    } catch (error: any) {
        // Handle errors and pass them to the next middleware
        return next(new ErrorHandler(error.message, 500));
    }
});

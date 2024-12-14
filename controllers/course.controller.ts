import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import mongoose from "mongoose";


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


// Function to EDIT COURSE
export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extracting course data from the request body
        const data = req.body;
        const thumbnail = data.thumbnail;

        // Check if a new thumbnail is provided
        if (thumbnail) {
            // Delete the existing thumbnail from Cloudinary
            await cloudinary.v2.uploader.destroy(thumbnail.public_id);
            
            // Upload the new thumbnail to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            // Update the thumbnail data with the new Cloudinary details
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }

        // Extract courseId from request parameters
        const courseId = req.params.id;

        // Validate the courseId to ensure it's a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID"
            });
        }

        // Find the course by ID and update its data
        const course = await CourseModel.findByIdAndUpdate(courseId, {
            $set: data
        }, { new: true }); // The `new: true` option returns the updated document

        // If no course is found, return a 404 response
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Respond with the updated course data
        res.status(200).json({
            success: true,
            course,
        });

    } catch (error: any) {
        // Catch and handle any errors, passing them to the global error handler
        return next(new ErrorHandler(error.message, 500));
    }
});

import { Response } from "express"; 
import CourseModel from "../models/course.model"; 
import { CatchAsyncError } from "../middleware/catchAsyncErrors"; 

// Function to create a new course
export const createCourse = CatchAsyncError(async (data: any, res: Response) => {
    // Save course data to the database
    const course = await CourseModel.create(data);

    // Respond with success status and the created course
    res.status(201).json({
        success: true,
        course
    });
});

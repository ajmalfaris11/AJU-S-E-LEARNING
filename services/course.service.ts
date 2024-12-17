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

// Service function to fetch all courses from the database
export const getAllCourseService = async (res: Response) => {
    try {
        // Fetch all courses from the database and sort them by 'createdAt' field in descending order
        const courses = await CourseModel.find().sort({ createdAt: -1 });

        // Send a response with a success status and the list of courses
        res.status(200).json({
            success: true, // Indicates that the request was successful
            courses,       // The list of courses retrieved from the database
        });
    } catch (error:any) {
        // Handle any errors that might occur while fetching courses
        res.status(500).json({
            success: false,  // Indicates an error occurred
            message: error.message,  // Include the error message in the response
        });
    }
};

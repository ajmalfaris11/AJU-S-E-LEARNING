import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import mongoose from "mongoose";
import { redis } from "../utils/redis";

// Function to handle course uploads
export const uploadCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body; // Extract course data from request body
            const thumbnail = data.thumbnail; // Extract thumbnail from course data

            if (thumbnail) {
                // Upload thumbnail to Cloudinary under the 'courses' folder
                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                // Attach Cloudinary upload details to the course data
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }

            // Call the createCourse function to save the course data to the database
            createCourse(data, res, next);
        } catch (error: any) {
            // Handle errors and pass them to the next middleware
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Function to EDIT COURSE
export const editCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
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
                    folder: "courses",
                });

                // Update the thumbnail data with the new Cloudinary details
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }

            // Extract courseId from request parameters
            const courseId = req.params.id;

            // Validate the courseId to ensure it's a valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid course ID",
                });
            }

            // Find the course by ID and update its data
            const course = await CourseModel.findByIdAndUpdate(
                courseId,
                {
                    $set: data,
                },
                { new: true }
            ); // The `new: true` option returns the updated document

            // If no course is found, return a 404 response
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found",
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
    }
);

// Get single course without requiring purchase
export const getSingleCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.id;

            // Check if course data exists in Redis cache
            const isCacheExist = await redis.get(courseId);

            if (isCacheExist) {
                // Return cached course data if available
                const course = JSON.parse(isCacheExist);
                res.status(200).json({
                    success: true,
                    course,
                });

                console.log("Hitting Redis Cache");
            } else {
                // Fetch course data from MongoDB if not found in Redis
                const course = await CourseModel.findById(req.params.id).select(
                    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
                );

                console.log("Hitting MongoDB");

                // Cache the fetched course data in Redis
                await redis.set(courseId, JSON.stringify(course));

                // Send the course data as a successful response
                res.status(200).json({
                    success: true,
                    course,
                });
            }
        } catch (error: any) {
            // Handle errors and pass to the next middleware
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Get all courses with Redis caching to optimize performance
export const getAllCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if all courses data exists in Redis cache
            const isCacheExist = await redis.get("allCourses");

            if (isCacheExist) {
                // Return cached courses data if available
                const courses = JSON.parse(isCacheExist);

                res.status(200).json({
                    sucess: true,
                    courses,
                });
            } else {
                // Fetch all courses from MongoDB if not found in Redis
                const courses = await CourseModel.find().select(
                    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
                );

                // Cache the fetched courses data in Redis
                await redis.set("allCourses", JSON.stringify(courses));

                // Send the list of courses as a successful response
                res.status(200).json({
                    success: true,
                    courses,
                });
            }
        } catch (error: any) {
            // Handle errors and pass to the next middleware
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Get course content - accessible only for valid and enrolled users
export const getCourseByUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Retrieve the list of courses the user is enrolled in
        const userCourseList = req.user?.courses;

        // Extract the requested course ID from the URL parameters
        const courseId = req.params.id;

        // Check if the requested course exists in the user's course list
        const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId);

        if (!courseExists) {
            // If the course is not found in the user's list, return a 404 error
            return next(new ErrorHandler("You are not eligible to access this course", 404));
        }

        // Fetch the course details from the database by ID
        const course = await CourseModel.findById(courseId);

        // Extract course content if the course exists
        const content = course?.courseData;

        // Respond with the course content
        res.status(200).json({
            success: true,
            content,
        });

    } catch (error: any) {
        // Handle unexpected errors and respond with a 500 status
        return next(new ErrorHandler(error.message, 500));
    }
});


// Add a Question to Course Content
interface IAddQuestionData {
    question: string; // The question text provided by the user
    courseId: string; // ID of the course where the question will be added
    contentId: string; // ID of the specific course content to which the question belongs
};

export const addQueston = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Destructure and type-check input data from the request body
        const { question, courseId, contentId }: IAddQuestionData = req.body;

        // Find the course by its ID
        const course = await CourseModel.findById(courseId);

        // Validate the `contentId` to ensure it is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400));
        }

        // Locate the specific content within the course by matching the `contentId`
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));

        // Create a new question object with the provided data
        const newQuestion: any = {
            user: req.user, // Associate the question with the currently authenticated user
            question, // The question text
            questionReplies: [], // Initialize an empty array for replies to this question
        };

        // Add the new question to the `questions` array of the specific course content
        courseContent?.questions.push(newQuestion);

        // Save the updated course back to the database
        await course?.save();

        // Send a success response with the updated course data
        res.status(200).json({
            success: true,
            course,
        });

    } catch (error: any) {
        // Handle any unexpected errors gracefully
        return next(new ErrorHandler(error.message, 500));
    }
});

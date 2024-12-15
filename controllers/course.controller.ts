import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import mongoose from "mongoose";
import { redis } from "../utils/redis";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";


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

        // If no matching content is found, return an error indicating an invalid `contentId`
        if (!courseContent) {
            return next(new ErrorHandler("Invalid content id", 400))
        }

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

// Add an Answer to a Course Question
interface IAddAnswerData {
    answer: string; // The answer text provided by the user
    courseId: string; // ID of the course where the question exists
    contentId: string; // ID of the specific course content containing the question
    questionId: string; // ID of the specific question to which the answer belongs
}

export const answerQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Destructure and type-check input data from the request body
        const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;

        // Find the course by its ID
        const course = await CourseModel.findById(courseId);

        // Validate the `contentId` to ensure it is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400));
        }

        // Locate the specific content within the course by matching the `contentId`
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));

        // Check if the specified course content exists
        if (!courseContent) {
            return next(new ErrorHandler("Invalid content id", 400));
        }

        // Locate the specific question within the content by matching the `questionId`
        const question = courseContent?.questions?.find((item: any) => item._id.equals(questionId));

        // Check if the specified question exists
        if (!question) {
            return next(new ErrorHandler("Invalid question id", 400));
        }

        // Create a new answer object with the provided data
        const newAnswer: any = {
            user: req.user, // Associate the answer with the currently authenticated user
            answer, // The answer text
        };

        // Add the new answer to the `questionReplies` array of the specified question
        question.questionReplies.push(newAnswer);

        // Save the updated course back to the database
        await course?.save();

        if (req.user?._id === question.user._id) {
            // create notification
        }

        // If the user replying is not the author of the question, send a notification to email
        else {
            const data = {
                name: question.user.name, // Name of the question author
                title: courseContent.title, // Title of the course content
                replayContent: answer, // The answer text being replied
            };

            // Render the email HTML template using EJS with the answer details
            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-replay.ejs"), data);

            try {
                // Send the email notification to the question author
                await sendMail({
                    email: question.user.email, // The question author's email
                    subject: "Question Replay", // Email subject
                    template: "Question-replay.ejs", // Template for the email
                    data, // Data to be inserted in the template
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }
        }


        // Send a success response
        res.status(200).json({
            success: true,
            course,
        });


    } catch (error: any) {
        // Handle any unexpected errors gracefully
        return next(new ErrorHandler(error.message, 500));
    }
});

// Interface for the data structure of a review to be added
interface IAddReviewData {
    review: string; // The review text provided by the user
    rating: number; // The rating for the course (e.g., out of 5)
    userId: string; // ID of the user adding the review
}

export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the list of courses the user has access to
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;

        // Check if the user has access to the course by verifying courseId in userCourseList
        const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId.toString());

        if (!courseExists) {
            // Return an error if the user is not eligible to review the course
            return next(new ErrorHandler("You are not eligible to access this course", 400));
        };

        // Find the course in the database by its ID
        const course = await CourseModel.findById(courseId);

        // Extract review and rating data from the request body
        const { review, rating } = req.body as IAddReviewData;

        // Create a new review object
        const reviewData: any = {
            user: req.user, // The user adding the review
            comment: review, // The text of the review
            rating, // The rating provided for the course
        };

        // Add the new review to the course's reviews array
        course?.reviews.push(reviewData);

        // Initialize the average rating variable to 0
        let avg = 0;

        // Iterate through each review in the course's reviews array
        course?.reviews.forEach((rev: any) => {
            // Accumulate the rating from each review
            avg += rev.rating;
        });

        // Calculate the average rating only if the course exists
        if (course) {
            // Compute the average by dividing the total rating by the number of reviews
            course.ratings = avg / course.reviews.length;
        }


        await course?.save();

    } catch (error: any) {
        // Handle and forward errors to the error handler
        return next(new ErrorHandler(error.message, 500));
    }
});

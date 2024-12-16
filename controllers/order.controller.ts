import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel, { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { newOrder } from "../services/order.service";

// Controller to create an order for a course
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract courseId and payment info from the request body
      const { courseId, payment_info } = req.body as IOrder;

      // Find the user based on the authenticated user ID from the request
      const user = await userModel.findById(req.user?._id);

      // Log user details for debugging (can be removed in production)
      console.log(user);

      // Check if the user has already purchased the course
      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );

      // If the course is already purchased, return a 400 error
      if (courseExistInUser) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      // Fetch the course by its ID
      const course = await CourseModel.findById(courseId);

      // If course does not exist, return a 404 error
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Prepare the data to be stored in the order
      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      // Prepare the email content with order details
      const mailData = {
        order: {
          _id: course.id.toString().slice(0, 6),  // Generate a short order ID
          name: course.name,
          price: course.price,
          data: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      // Render the HTML content of the order confirmation email using ejs template
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      // Try sending the order confirmation email to the user
      try {
        if (user) {
          // Send email with order details
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",  // Corrected typo: "Conformation" -> "Confirmation"
            template: "order-confirmation.ejs",  // Email template name
            data: mailData,  // Email data to be included in the template
          });
        }
      } catch (error: any) {
        // If email fails to send, return an internal server error
        return next(new ErrorHandler(error.message, 500));
      }

      // Add the purchased course to the user's list of enrolled courses
      user?.courses.push(course.id);
      await user?.save();

      // Create a notification for the user about the new order
      await NotificationModel.create({
        user: user?._id,
        title: "New Order",
        message: `You have a new order from ${course?.name}`,
      });

      // Increment the purchased count for the course
      if (course.purchased) {
        course.purchased += 1;
      } else {
        course.purchased = 1;  // Initialize purchase count if not set
      }

      // Save the updated course with the incremented purchase count
      await course.save();

      // Call the newOrder function to store the order in the database and respond
      newOrder(data, res, next);

    } catch (error: any) {
      // Catch any errors during the process and pass them to the next middleware
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

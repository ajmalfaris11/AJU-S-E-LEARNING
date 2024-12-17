import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import NotificationModel from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";

// Controller to fetch all notifications (only for admin)
export const getNotifications = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch all notifications from the database, sorted by creation date in descending order
        const notifications = await NotificationModel.find().sort({ createdAt: -1 });

        // Respond with a success status and the list of notifications
        res.status(201).json({
            success: true,
            notifications,
        });

    } catch (error: any) {
        // In case of any error, pass it to the next middleware with a 500 status code
        return next(new ErrorHandler(error.message, 500));
    }
});


// Controller to update the notification status to 'read' (only for admin)
export const updateNotication = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch the notification from the database using the notification ID from the request parameters
        const notification = await NotificationModel.findById(req.params.id);

        // If notification is not found, return a 404 error
        if (!notification) {
            return next(new ErrorHandler("Notification not found", 404));
        } else {
            // If the notification exists, set the status to 'read' if it's not already set
            notification.status ? notification.status = 'read' : notification?.status;
        }

        // Save the updated notification status in the database
        await notification.save();

        // Fetch all notifications from the database, sorted by creation date in descending order (latest first)
        const notifications = await NotificationModel.find().sort({
            createdAt: -1,
        });

        // Respond with the success status and the updated list of notifications
        res.status(201).json({
            success: true,
            notifications,
        });

    } catch (error: any) {
        // If any error occurs, pass the error to the next middleware with a 500 status code
        return next(new ErrorHandler(error.message, 500));
    }
});

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

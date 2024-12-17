import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.model";

// Controller to create a new order
export const newOrder = CatchAsyncError(async (data:any, res: Response, next: NextFunction) => {

    // Create a new order document in the database
    const order = await OrderModel.create(data); 

    res.status(200).json({
        success:true,
        order,
    })
});


// Service function to fetch all orders from the database
export const getAllOrderServices = async (res: Response) => {
    try {
        // Fetch all orders from the database and sort them by 'createdAt' field in descending order
        const orders = await OrderModel.find().sort({ createdAt: -1 });

        // Send a response with a success status and the list of orders
        res.status(200).json({
            success: true, // Indicates that the request was successful
            orders,        // The list of orders retrieved from the database
        });
    } catch (error:any) {
        // Handle any errors that might occur while fetching orders
        res.status(500).json({
            success: false,  // Indicates an error occurred
            message: error.message,  // Include the error message in the response
        });
    }
};

import { Response } from "express";
import userModel from "../models/user.model";

// Function to get user details by their ID
export const getUserById = async (id: string, res: Response) => {
    // Fetch the user from the database using the provided ID
    const user = await userModel.findById(id);
    
    // Respond with the fetched user details in JSON format
    res.status(201).json({
        success: true,
        user,
    });
};

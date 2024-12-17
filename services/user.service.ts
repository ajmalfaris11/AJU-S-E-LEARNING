// Function to get user details by their ID
// This updated function first checks if the user data is available in the Redis cache using the user's ID.
// If the user data is found in Redis, it is parsed and sent in the response.
// If the user data is not found in Redis, no further action is taken in this code snippet, but it can be extended to fetch from the database.

import { Response } from "express";
import { redis } from "../utils/redis";
import userModel from "../models/user.model";

export const getUserById = async (id: string, res: Response) => {
    // Attempt to get the user data from Redis cache
    const userJson = await redis.get(id);

    // If user data is found in the cache
    if (userJson) {
        // Parse the user JSON and send it in the response
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user,
        });
    }
};


// Service function to fetch all users from the database
export const getAllUserService = async (res: Response) => {
    try {
        // Fetch all users from the database and sort them by 'createdAt' field in descending order
        const users = await userModel.find().sort({ createdAt: -1 });

        // Send a response with a success status and the list of users
        res.status(200).json({
            success: true, // Indicates the request was successful
            users,         // The list of users fetched from the database
        });
    } catch (error) {
        // Handle any errors that might occur while fetching users
        res.status(500).json({
            success: false, // Indicates an error occurred
            message: error.message, // Include the error message in the response
        });
    }
};


// Function to get user details by their ID
// This updated function first checks if the user data is available in the Redis cache using the user's ID.
// If the user data is found in Redis, it is parsed and sent in the response.
// If the user data is not found in Redis, no further action is taken in this code snippet, but it can be extended to fetch from the database.

import { Response } from "express";
import { redis } from "../utils/redis";

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


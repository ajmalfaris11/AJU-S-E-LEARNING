// Import required modules
import { Request, Response, NextFunction } from "express"; // Import types for Request, Response, and NextFunction
import { CatchAsyncError } from "./catchAsyncErrors"; // Import CatchAsyncError utility to handle async errors
import ErrorHandler from "../utils/ErrorHandler"; // Import custom error handler class
import jwt, { JwtPayload } from "jsonwebtoken"; // Import jwt for token verification
import { redis } from "../utils/redis"; // Import Redis client for session management

// Middleware to authenticate user by verifying the access token
export const isAuthenticated = CatchAsyncError( async (req: Request, res: Response, next: NextFunction) => {
    // Retrieve the access token from cookies
    const access_token = req.cookies.access_token as string;

    // Check if the access token exists in the cookies
    if (!access_token) {
        // If not, return an error response with a message indicating login is required
        return next(new ErrorHandler("Please login to access this resource", 400));
    }

    // Verify the token using the secret stored in environment variables
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

    // Check if the decoded token is valid
    if (!decoded) {
        // If not, return an error response indicating the token is not valid
        return next(new ErrorHandler("access token is not valid", 400));
    }

    // Fetch user data from Redis using the user ID decoded from the token
    const user = await redis.get(decoded.id);

    // Check if the user exists in Redis
    if (!user) {
        // If not, return an error response indicating the user was not found
        return next(new ErrorHandler("user not found", 400));
    }

    // Parse the user data from the Redis store and attach it to the request object
    req.user = JSON.parse(user);

    // Proceed to the next middleware or route handler
    next();
});

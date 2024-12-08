// Import required modules
require("dotenv").config(); // Load environment variables from .env file
import { Response } from "express"; // Import Response type from express
import { IUser } from "../models/user.model"; // Import the IUser interface from the user model
import { redis } from "./redis"; // Import the Redis client

// Interface for token options to define properties like expiry, max age, etc.
interface ITokenOptions {
    expires: Date; // Expiration time for the cookie
    maxAge: number; // Max age for the cookie in milliseconds
    httpOnly: boolean; // Ensures cookie is not accessible by JavaScript (for security)
    sameSite: 'lax' | 'strict' | 'none' | undefined; // Same-site cookie settings for security
    secure?: boolean; // Optionally define if cookie should be secure (HTTPS only)
}

 // Parse environment variables for token expiration times with fallback values
 const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10); // Access token expiration (default 300 seconds)
 const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10); // Refresh token expiration (default 1200 seconds)

 // Configure options for the access token cookie
 export const accessTokenOption: ITokenOptions = {
     expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000), // Set expiry based on environment variable
     maxAge: accessTokenExpire * 60 * 60 * 1000, // Max age in milliseconds
     httpOnly: true, // Ensure the cookie is not accessible via JavaScript
     sameSite: 'lax', // SameSite attribute for cookie (lax means sent with same-site requests)
 }

 // Configure options for the refresh token cookie
 export const refreshTokenOptions: ITokenOptions = {
     expires: new Date(Date.now() + accessTokenExpire * 24 * 60 * 60 * 1000), // Expiry time for refresh token
     maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000, // Max age for refresh token
     httpOnly: true, // Ensure cookie is HTTP only (not accessible via JS)
     sameSite: 'lax', // SameSite attribute for the refresh token cookie
 };

// Function to send JWT tokens (access and refresh tokens) to the client
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
    // Generate access and refresh tokens using methods defined in the user model
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // Store session data in Redis for fast access
    redis.set(user._id, JSON.stringify(user) as any);

    // If the environment is production, set secure flag to ensure cookies are only sent over HTTPS
    if (process.env.NODE_ENV === 'production') {
        accessTokenOption.secure = true; // Enable secure cookie in production
    };

    // Set the cookies on the response object for both access and refresh tokens
    res.cookie("access_token", accessToken); // Set the access token cookie
    res.cookie("refresh_token", refreshToken, refreshTokenOptions); // Set the refresh token cookie with options

    // Send a JSON response with success status, the user object, and the access token
    res.status(statusCode).json({
        success: true, // Indicates that the request was successful
        user, // User data being returned
        accessToken, // Access token sent in the response
    });
}

import { Request, Response, NextFunction } from "express"; // Importing Express types for request, response, and middleware
import userModel from "../models/user.model"; // Importing the user model for database operations
import ErrorHandler from "../utils/ErrorHandler"; // Custom error handler for handling application errors
import { CatchAsyncError } from "../middleware/catchAsyncErrors"; // Middleware to catch asynchronous errors
import jwt, { Secret } from "jsonwebtoken"; // Importing JWT for token creation
require('dotenv').config(); // Loading environment variables from .env file

// Interface for the registration request body
interface IRegistrationBody {
    name: string;       // User's name
    email: string;      // User's email
    password: string;   // User's password
    avatar?: string;    // Optional user avatar URL
}

// Function to register a new user
export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body; // Destructuring user details from the request body

        // Check if the email already exists in the database
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler("Email already exists", 400)); // If email exists, send an error
        }

        // Create a new user object with the request data
        const user: IRegistrationBody = {
            name,
            email,
            password,
        };

        // Generate an activation token for the user
        const activationToken = createActivationToken(user);
        console.log(activationToken); // Optional: Log the token for debugging

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400)); // Pass any errors to the error handling middleware
    }
});

// Interface for the activation token response
interface IActivationToken {
    token: string;          // The JWT activation token
    activationCode: string; // 4-digit activation code for verification
}

// Function to create an activation token
export const createActivationToken = (user: any): IActivationToken => {
    // Generate a 4-digit random activation code
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Sign a JWT with the user data and activation code
    const token = jwt.sign(
        {
            user,
            activationCode,
        },
        process.env.ACTIVATION_SECRET as Secret, // Use the secret key from environment variables
        {
            expiresIn: "5m", // Token expires in 5 minutes
        }
    );

    return { token, activationCode }; // Return the generated token and activation code
};

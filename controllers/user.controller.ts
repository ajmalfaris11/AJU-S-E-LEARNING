require('dotenv').config(); // Load environment variables from the .env file
import { Request, Response, NextFunction } from "express"; // Import types for request, response, and middleware
import userModel from "./models/user.model"; // Import the user model for database operations
import ErrorHandler from "../utils/ErrorHandler"; // Custom error handler to standardize error responses
import { CatchAsyncError } from "../middleware/catchAsyncErrors"; // Middleware to catch and handle asynchronous errors
import jwt, { Secret } from "jsonwebtoken"; // Import JWT for token generation and verification
import ejs from "ejs"; // Import EJS for rendering dynamic email templates
import path from "path"; // Utility for working with file paths
import sendMail from "../utils/sendMail"; // Utility for sending emails

// Define the structure of the registration request body
interface IRegistrationBody {
    name: string;       // User's full name
    email: string;      // User's email address
    password: string;   // User's password
    avatar?: string;    // Optional URL for the user's profile avatar
}

// Controller function to handle user registration
export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body; // Extract user details from the request body

        // Check if the provided email is already registered
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler("Email already exists", 400)); // Send error if email is already in use
        }

        // Create a new user object using the extracted data
        const user: IRegistrationBody = { name, email, password };

        // Generate an activation token and 4-digit activation code for the user
        const activationToken = createActivationToken(user);

        // Prepare data for rendering the activation email template
        const activationCode = activationToken.activationCode; // Extract the activation code
        const data = { user: { name: user.name }, activationCode };

        // Render the activation email template
        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

        // Try sending the activation email
        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account", // Email subject line
                template: "activation-mail.ejs",  // EJS template file for the email
                data,                              // Data to populate the email template
            });

            // Respond with success message and activation token (for debugging or internal use)
            res.status(201).json({
                success: true,
                message: `Please check your email (${user.email}) to activate your account!`,
                activationToken: activationToken.token, // Token included for internal tracking (if needed)
            });
        } catch (error: any) {
            // Handle email sending errors
            return next(new ErrorHandler(error.message, 400));
        }
    } catch (error: any) {
        // Handle general errors during the registration process
        return next(new ErrorHandler(error.message, 400));
    }
});

// Define the structure of the activation token response
interface IActivationToken {
    token: string;          // The JWT activation token
    activationCode: string; // 4-digit numeric activation code for verification
}

// Function to create an activation token and code
export const createActivationToken = (user: any): IActivationToken => {
    // Generate a random 4-digit numeric activation code
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Create a JWT with user information and the activation code
    const token = jwt.sign(
        {
            user,             // Embed user data in the token
            activationCode,   // Include the activation code in the token payload
        },
        process.env.ACTIVATION_SECRET as Secret, // Use secret key from environment variables
        {
            expiresIn: "5m",  // Token validity period (5 minutes)
        }
    );

    // Return the activation token and code
    return { token, activationCode };
};

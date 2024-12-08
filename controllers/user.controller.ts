require('dotenv').config(); // Load environment variables from the .env file
import { Request, Response, NextFunction } from "express"; // Import types for request, response, and middleware
import userModel, { IUser } from "../models/user.model"; // Import the user model for database operations
import ErrorHandler from "../utils/ErrorHandler"; // Custom error handler to standardize error responses
import { CatchAsyncError } from "../middleware/catchAsyncErrors"; // Middleware to catch and handle asynchronous errors
import jwt, { JwtPayload, Secret } from "jsonwebtoken"; // Import JWT for token generation and verification
import ejs from "ejs"; // Import EJS for rendering dynamic email templates
import path from "path"; // Utility for working with file paths
import sendMail from "../utils/sendMail"; // Utility for sending emails
import { accessTokenOption, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";


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


// active user

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_token, activation_code } = req.body as IActivationRequest;
        const newUser: { user: IUser; activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as { user: IUser; activationCode: string };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code", 400));
        };

        const { name, email, password } = newUser.user;

        const existUser = await userModel.findOne({ email });

        if (existUser) {
            return next(new ErrorHandler("Email already exist", 400));
        }

        const user = await userModel.create({
            name,
            email,
            password,
        });

        res.status(201).json({
            success: true,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});


//  Login user
interface ILoginRequest {
    email: string;
    password: string;
}

// ===== Login user controller =====  Login user controller =====  Login user controller =====

interface ILoginRequest {
    email: string;
    password: string;
}


export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract email and password from request body
        const { email, password } = req.body as ILoginRequest;

        // Check if email and password are provided
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        };

        // Find user by email and include the password field explicitly
        const user = await userModel.findOne({ email }).select("+password");

        // If user is not found, return error
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        // Compare provided password with stored password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        sendToken(user, 200, res);

        // Add further logic for successful login (e.g., token generation)
    } catch (error: any) {
        // Handle any unexpected errors
        return next(new ErrorHandler(error.message, 400));
    }
});


//* ===== Logout user controller =====  Logout user controller =====  Logout user controller =====

// Import necessary modules and error handling functions
export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Clear the access_token cookie by setting its expiration time to 1 millisecond
        res.cookie("access_token", "", { maxAge: 1 });

        // Clear the refresh_token cookie by setting its expiration time to 1 millisecond
        res.cookie("refresh_token", "", { maxAge: 1 });

        // Retrieve the user ID from the request object, if available. 
        const userId = req.user?._id || "";

        // Remove the user data associated with the retrieved user ID from Redis cache.
        redis.del(userId);


        // Send a success response indicating that the user has logged out
        res.status(200).json({
            success: true, // Indicates successful logout
            message: "Logged out successfully" // Confirmation message
        });
    } catch (error: any) {
        // If an error occurs, pass it to the next error handling middleware with a 400 status code
        return next(new ErrorHandler(error.message, 400));
    }
});


// Method: updateAccessToken
// Description: This method securely refreshes the access token for authenticated users.
// It verifies the refresh token from cookies, checks the session in Redis, 
// and issues new access and refresh tokens. It helps maintain secure user sessions 
// and prevents unauthorized access.
// 
// Why: This approach is commonly used by major platforms like Amazon, Flipkart, and Facebook 
// to ensure seamless authentication and security.
// 
// Security Features:
// - JWT verification for refresh token validation.
// - Redis session check to ensure token validity.
// - Secure cookies with HTTP-only and SameSite options.
// - Access token with short expiration for enhanced security.
// - Refresh token with longer expiration for persistent login.

export const updateAccessToken = CatchAsyncError (async (req:Request, res:Response, next:NextFunction) => {
    try {
        // Extract the refresh token from cookies
        const refresh_token = req.cookies.refresh_token as string;

        // Verify the refresh token
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
        const message = 'Could not refresh token';

        // Check if token is valid
        if (!decoded) {
            return next(new ErrorHandler(message, 400));
        }

        // Check if session exists in Redis
        const session = await redis.get(decoded.id as string);
        if (!session) {
            return next(new ErrorHandler(message, 400));
        }

        // Parse the user data from the session
        const user = JSON.parse(session);

        // Generate new access and refresh tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
            expiresIn: "5m", // Short expiration for security
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
            expiresIn: "3d", // Longer expiration for persistent login
        });

        // Set secure cookies for the tokens
        res.cookie("access_token", accessToken, accessTokenOption);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        // Respond with the new access token
        res.status(200).json({
            status: "success",
            accessToken,
        });
    } catch (error: any) {
        // Handle errors securely
        return next(new ErrorHandler(error.message, 400));
    }
});




// Get User Information
// This function retrieves user information based on the user ID stored in the request object.
// It uses the `getUserById` function to fetch the user details and respond to the client.
// In case of any errors, it passes the error to the error handling middleware.

export const getUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the user ID from the request object
        const userId: any = req.user?._id;

        // Retrieve user information using the helper function
        getUserById(userId, res);
    } catch (error: any) {
        // Handle errors by passing them to the error handling middleware
        return next(new ErrorHandler(error.message, 400));
    }
});


interface ISocialAuthBody {
    email: string;
    name: string;
    avatar: string;
}

// Social Authentication Function
// This function handles the authentication of a user via a third-party social authentication service.
// It checks if the user already exists by their email, and either creates a new user or returns an existing one.
// Once the user is found or created, a token is generated and sent to the user for authentication.

export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Destructure the email, name, and avatar from the request body
        const { email, name, avatar } = req.body as ISocialAuthBody;

        // Check if a user already exists with the provided email
        const user = await userModel.findOne({ email });

        // If the user doesn't exist, create a new one and send a token
        if (!user) {
            const newUser = await userModel.create({ email, name, avatar });
            sendToken(newUser, 200, res);
        } else {
            // If the user exists, send a token for the existing user
            sendToken(user, 200, res);
        }

    } catch (error: any) {
        // Handle errors by passing them to the error handler middleware
        return next(new ErrorHandler(error.message, 400));
    }
});

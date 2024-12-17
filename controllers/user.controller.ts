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
import { getAllUserService, getUserById, updateUserRoleServices } from "../services/user.service";
import cloudinary from "cloudinary";


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

        req.user = user;

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



// Update User Information
// This function allows updating a user's name and/or email based on the request body.
// It checks if the new email already exists in the database and returns an error if it does.
// If the user exists and valid changes are provided, the user info is updated and saved.
// The updated user data is also cached in Redis for fast retrieval.
// After the update, a success response with the updated user information is sent.

interface IUpdateUserInfo {
    name?: string;
    email?: string;
}

export const updateUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Destructure the name and email from the request body
        const { name, email } = req.body as IUpdateUserInfo;

        // Get the user ID from the authenticated user
        const userId: any = req.user?._id;

        // Find the user by their ID
        const user = await userModel.findById(userId);

        // Check if the new email already exists in the database
        if (email && user) {
            const isEmailExist = await userModel.findOne({ email });
            if (isEmailExist) {
                // Return an error if the email already exists
                return next(new ErrorHandler("Email already exists", 400));
            }
            user.email = email;
        }

        // Update the user's name if provided
        if (name && user) {
            user.name = name;
        }

        // Save the updated user information to the database
        await user?.save();

        // Update the user data in Redis cache
        await redis.set(userId, JSON.stringify(user));

        // Send a success response with the updated user data
        res.status(201).json({
            success: true,
            user,
        });
    } catch (error: any) {
        // Handle errors and pass them to the error handler
        return next(new ErrorHandler(error.message, 400));
    }
});


// *UPDATE PASWORD ===== UPDATE PASWORD ===== UPDATE PASWORD ===== UPDATE PASWORD 


// Interface to define the structure of the request body for updating the password
interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
}

// Controller function to handle password update logic
export const updatePassword = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Destructure old and new password from the request body
        const { oldPassword, newPassword } = req.body as IUpdatePassword;

        // Get userId from the authenticated user object
        const userId: any = req.user?._id;

        // Check if both old and new passwords are provided
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler("Please enter the old and new password", 400));
        }

        // Find the user from the database and select the password field
        const user = await userModel.findById(req.user?._id).select("+password");

        // Check if the user is valid and has a password field
        if (user?.password === undefined) {
            return next(new ErrorHandler("Invalid user", 400));
        }

        // Compare the old password with the stored password
        const isPasswordMatch = await user?.comparePassword(oldPassword);

        // If old password doesn't match, return an error
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid old password", 400));
        }

        // Update the user's password with the new password
        user.password = newPassword;

        // Save the updated user document
        await user.save();

        // Update the user data in Redis cache
        await redis.set(userId, JSON.stringify(user));

        // Return a success response with the updated user object
        res.status(201).json({
            success: true,
            user,
        });

    } catch (error: any) {
        // Return error response if an exception occurs
        return next(new ErrorHandler(error.message, 400)); 
    }
});

// *UPDATE AVATAR ===== UPDATE AVATAR ===== UPDATE AVATAR ===== UPDATE AVATAR 
// Handles user profile picture updates using Cloudinary and Redis caching

interface IUpdatePicture {
    avatar: string;  // Expected structure for the avatar data
}

export const updateProfilePicture = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract avatar from request body
        const { avatar }: IUpdatePicture = req.body;

        // Extract user ID from request object
        const userId = req?.user?._id as string;

        // Fetch user data from the database
        const user = await userModel.findById(userId);

        // Proceed if both avatar and user data exist
        if (avatar && user) {
            if (user?.avatar?.public_id) {
                // Delete the existing avatar from Cloudinary
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
            }

            // Upload the new avatar to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "avatars",   // Define upload folder in Cloudinary
                width: 150,          // Set image width for standardization
            });

            // Update user avatar details in the database
            user.avatar = {
                public_id: myCloud.public_id, // Unique Cloudinary public ID
                url: myCloud.secure_url,      // Secure Cloudinary image URL
            };
        }

        // Save updated user details to the database
        await user?.save();

        // Cache the updated user data in Redis
        await redis.set(userId, JSON.stringify(user));

        // Respond with success status and updated user data
        res.status(200).json({
            success: true,
            user,
        });

    } catch (error: any) {
        // Handle unexpected errors and pass them to global error middleware
        return next(new ErrorHandler(error.message, 400)); 
    }
});

// Controller to get all users - restricted to admin access only
export const getAllUsers = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Calling the service function to fetch all users from the database and send the response
        getAllUserService(res);
    } catch (error: any) {
        // In case of any error, pass it to the error handler with a 400 status code
        return next(new ErrorHandler(error.message, 400));
    }
});


// Update user role - Only accessible by admin
export const updateUserRole = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract user ID and new role from the request body
        const { id, role } = req.body;

        // Call the service function to update the user role
        updateUserRoleServices(res, id, role);

    } catch (error: any) {
        // Pass the error to the centralized error handler
        return next(new ErrorHandler(error.message, 400));
    }
});

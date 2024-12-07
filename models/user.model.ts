require ('dotenv').config();
import mongoose, { Document, Model, Schema } from "mongoose"; // Importing required modules and types from Mongoose
import bcrypt from "bcryptjs"; // Importing bcrypt for password hashing
import jwt from "jsonwebtoken";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
// Regular expression for validating email addresses
const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// IUser interface extending Mongoose's Document interface
export interface IUser extends Document {
    name: string; // User's full name
    email: string; // User's email address
    password: string; // User's password (hashed)
    avatar: {      // User's profile avatar
        public_id: string; // Cloud storage public ID
        url: string;       // URL of the avatar
    };
    role: string; // User role (e.g., "admin" or "user")
    isVerified: boolean; // Whether the user's email is verified
    courses: Array<{ courseId: string }>; // List of enrolled courses with their IDs
    comparePassword: (password: string) => Promise<boolean>; // Function to compare passwords
    SignAccessToken: () => string;
    SignRefreshToken: () => string;

}

// Defining Mongoose schema for the user model with TypeScript type checking
const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"], // Validation message for missing name
        },
        email: {
            type: String,
            required: [true, "Please enter your email"], // Validation message for missing email
            validate: {
                validator: function (value: string) {
                    return emailRegexPattern.test(value); // Email format validation using regex
                },
                message: "Please enter a valid email", // Validation message for invalid email format
            },
            unique: true, // Ensures email uniqueness in the database
        },
        password: {
            type: String,
            required: [true, "Please enter your password"], // Validation message for missing password
            minlength: [6, "Password must be at least 6 characters"], // Minimum length validation
            select: false, // Ensures password is not selected by default in queries
        },
        avatar: {
            public_id: String, // Cloud storage public ID for the avatar
            url: String,       // URL for the avatar
        },
        role: {
            type: String,
            default: "user", // Default role is set to "user"
        },
        isVerified: {
            type: Boolean,
            default: false, // Default verification status is set to false
        },
        courses: [
            {
                courseId: String, // Unique ID of the enrolled course
            },
        ],
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Middleware to hash the password before saving the user document
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
        return next(); // Skip hashing if the password is not modified
    }
    this.password = await bcrypt.hash(this.password, 10); // Hash password with a salt factor of 10
    next(); // Proceed to the next middleware
});

// Sign access token
userSchema.methods.SignAccessToken = function (){
    return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN || '');
};

// sign refresh token
userSchema.methods.SignRefreshToken = function () {
    return jwt.sign({id: this._id}, process.env.REFRESH_TOKEN || '')
}

// Method to compare entered password with the stored hashed password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password); // Returns true if passwords match
};

// Creating and exporting the Mongoose model for users
const userModel: Model<IUser> = mongoose.model("user", userSchema);
export default userModel;


// Login user controller
export const loginUser = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
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

        // Add further logic for successful login (e.g., token generation)
    } catch (error: any) {
        // Handle any unexpected errors
        return next(new ErrorHandler(error.message, 400));
    }
});
import { NextFunction, Request, Response } from "express"; // Importing Express types for request, response, and next function
import ErrorHandler from "../utils/ErrorHandler"; // Importing the custom ErrorHandler class for structured error handling

// Error handling middleware to handle various types of errors and respond with appropriate messages
module.exports = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Set default status code and message if not already defined
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // Handle invalid MongoDB ObjectId error (CastError)
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400); // Respond with a 400 Bad Request
    }

    // Handle duplicate key error (MongoDB unique constraint violation)
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400); // Respond with a 400 Bad Request
    }

    // Handle invalid JWT error
    if (err.name === 'JsonWebTokenError') {
        const message = `JSON Web Token is invalid, try again`;
        err = new ErrorHandler(message, 400); // Respond with a 400 Bad Request
    }

    // Handle expired JWT error
    if (err.name === 'TokenExpiredError') {
        const message = `JSON Web Token has expired, try again`;
        err = new ErrorHandler(message, 400); // Respond with a 400 Bad Request
    }

    // Send a JSON response with the error status and message
    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};

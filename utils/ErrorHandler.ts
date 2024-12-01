// Custom error handler class that extends the built-in Error class

class ErrorHandler extends Error {
    statusCode: Number; // Define a property to store the HTTP status code

    // Constructor to initialize the error message and status code
    constructor(message: any, statusCode: Number) {
        super(message); // Call the parent class (Error) constructor to set the error message
        this.statusCode = statusCode; // Set the custom status code for the error

        // Capture the stack trace for debugging purposes, excluding this constructor from the stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

// Export the ErrorHandler class for use in other parts of the application
module.exports = ErrorHandler;

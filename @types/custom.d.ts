import { request } from "express"; // Import the express request module
import { IUser } from "../models/user.model"; // Import the IUser interface from the user model

// Extend the Express namespace to add a custom user property to the Request object
declare global {
    namespace Express {
        // Extend the Request interface to include an optional 'user' property of type IUser
        interface Request {
            user?: IUser; // The 'user' property will hold the authenticated user data
        }
    }
}

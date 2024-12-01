require('dotenv').config();
import express from "express";
export const app = express();

import cors from "cors"; // Importing CORS middleware for handling Cross-Origin Resource Sharing
import cookieParser from "cookie-parser"; // Importing cookie-parser for handling cookies in requests

// Configuring body-parser middleware to parse incoming JSON requests with a size limit of 50MB
app.use(express.json({ limit: "50mb" }));

// Using cookie-parser to parse cookies attached to client requests
app.use(cookieParser());

// Configuring CORS to allow requests from the specified origin defined in environment variables
app.use(cors({
    origin: process.env.ORIGIN // Origin URL set in the environment variable for security and flexibility
}));

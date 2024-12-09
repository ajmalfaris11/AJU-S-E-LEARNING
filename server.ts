import { app } from "./app";
import cloudinary from "cloudinary";
import connectDb from "./utils/db";

require("dotenv").config();

// Configuring Cloudinary for cloud storage and image uploads
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,  // Cloudinary account name
    api_key: process.env.CLOUD_API_KEY,  // API key for authentication
    api_secret: process.env.CLOUD_SECRET_KEY  // Secret key for secure API access
});


// create server
const port = process.env.PORT || 5000

app.listen(port, () => {
    console.log(`Server is Connecterd with port ${port}`);
    connectDb();
} )
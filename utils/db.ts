import mongoose from "mongoose"; // Importing Mongoose for MongoDB connection

require('dotenv').config(); // Loading environment variables from the .env file

// Fetching the database URL from environment variables or using an empty string as a fallback
const dbUrl:string = process.env.DB_URL || '';

// Function to establish a connection to the MongoDB database
const connectDb = async () => {
    try {
        // Attempt to connect to the database and log the host on success
        await mongoose.connect(dbUrl).then((data: any) => {
            console.log(`Database connected with ${data.connection.host}`);
        });
    } catch (error: any) {
        // Log any connection error and retry connection after 5 seconds
        console.log(error.message);
        setTimeout(connectDb, 5000);
    }
}

export default connectDb;
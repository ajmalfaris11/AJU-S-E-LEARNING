import { Redis } from 'ioredis'; // Importing Redis client from ioredis
require('dotenv').config(); // Loading environment variables from the .env file

// Function to initialize the Redis client
const redisClient = () => {
    if (process.env.REDIS_URL) { // Check if REDIS_URL is defined in environment variables
        console.log('Redis connected'); // Log successful connection message
        return process.env.REDIS_URL; // Return the Redis URL
    }
    throw new Error('Redis connection failed'); // Throw an error if the Redis URL is missing
};

// Exporting a new Redis instance using the Redis URL from the redisClient function
export const redis = new Redis(redisClient());

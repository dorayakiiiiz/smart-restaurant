// Cấu hình kết nối MongoDB ở đây

import mongoose from "mongoose";

import { configDotenv } from "dotenv";
configDotenv();

const MONGO_URI = process.env.MONGO_URI;

export default async function dbConnect() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connect to database successfully');
    } catch (error) {
        console.log(`Error while connecting to database: ${error}`);
    }
}
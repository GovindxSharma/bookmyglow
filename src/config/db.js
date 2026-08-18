import mongoose from "mongoose";
import { seedDatabase } from "./seed.js";

let mongod = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI && process.env.MONGO_URI.trim() !== ""
    ? process.env.MONGO_URI
    : null;

  if (mongoUri) {
    try {
      console.log("⏳ Connecting to configured MongoDB...");
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
      await seedDatabase();
      return;
    } catch (err) {
      console.warn(`⚠️ Could not connect to remote MONGO_URI (${err.message}). Falling back to in-memory database...`);
    }
  }

  // Fallback to Embedded MongoMemoryServer for instant local testing and offline capability
  try {
    console.log("🚀 Starting embedded In-Memory MongoDB for local development...");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`🟢 In-Memory MongoDB Connected: ${conn.connection.host}`);
    await seedDatabase();
  } catch (memoryErr) {
    console.error(`🔴 Critical DB Connection Error: ${memoryErr.message}`);
    process.exit(1);
  }
};

export default connectDB;

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  // Validate environment variables
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not defined in environment variables");
    process.exit(1);
  }

  // Basic URI format validation
  if (!process.env.MONGO_URI.startsWith("mongodb")) {
    console.error("❌ Invalid MONGO_URI format. Must start with 'mongodb'");
    process.exit(1);
  }

  try {
    // Connect to MongoDB with optimized options
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "myshop",
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
    });

    // Connection event listeners
    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ Mongoose disconnected from MongoDB");
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

// Graceful shutdown function
const gracefulShutdown = async (msg) => {
  try {
    await mongoose.connection.close();
    console.log(`✅ Mongoose closed through ${msg}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during graceful shutdown:", err);
    process.exit(1);
  }
};

// Handle process termination signals
process.on("SIGINT", () => gracefulShutdown("app termination (SIGINT)"));
process.on("SIGTERM", () => gracefulShutdown("app termination (SIGTERM)"));

export default connectDB;
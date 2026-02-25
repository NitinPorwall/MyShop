import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "myshop",
      // strictQuery is recommended for Mongoose 7+
      strictQuery: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
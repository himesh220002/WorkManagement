import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is not set in environment or .env");
  process.exit(1);
}

async function checkDatabase() {
  console.log("🔍 Checking MongoDB connection...");
  try {
    await mongoose.connect(uri!);
    console.log("✅ Successfully connected to MongoDB:", mongoose.connection.name);
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log("📦 Available collections:", collections?.map((c) => c.name).join(", ") || "None");
    await mongoose.disconnect();
    console.log("🔌 Disconnected cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
}

checkDatabase();

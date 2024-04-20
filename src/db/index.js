import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DB_URL}/${DB_NAME}`
    );
    console.log(
      `Database connected successfully !!! ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(`MONGODB CONNECTION ERROR: ${error}`);
    process.exit(1);
  }
}

export default connectDB;

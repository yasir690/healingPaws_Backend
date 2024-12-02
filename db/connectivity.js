import mongoose from "mongoose";
import dbConfig from "../config/dbConfig.js";
import { config } from "dotenv";
config();

const dbConnect = async () => {
  try {
    await mongoose.connect(dbConfig.db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Mongodb Connected.....");
  } catch (error) {
    console.log(error.message);
  }
};

export default dbConnect;

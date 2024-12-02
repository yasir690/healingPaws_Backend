import { config } from "dotenv";

config();
const dbConfig = {
  db: process.env.DB_COLLECTION,
  // db:process.env.LOCAL_DB
};

export default dbConfig;

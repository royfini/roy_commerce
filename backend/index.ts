import mongoose from "mongoose";
import { server } from "./app";
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 2020;

const start = async () => {
    if(!process.env.MONGO_URI){
        throw new Error("MONGO_URI must be defined");
    }
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDb");
  } catch (err) {
    console.error(err);
  }

  server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
};

start();


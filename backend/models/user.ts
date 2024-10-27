import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String },
  password: { type: String },
  role: { type: String },
});

const User = mongoose.model("User", userSchema);

export { User };

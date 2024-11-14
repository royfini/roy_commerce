import mongoose from "mongoose";
import { Hash } from "../utils/hash";

interface UserAttrs {
  email: string;
  password: string;
  role?: string;
  verified?: boolean;
}

interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
  role?: string;
  verified?: boolean;
}

interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

const userSchema = new mongoose.Schema({
  email: { type: String },
  password: { type: String },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  verified: { type: Boolean, default: false },
},
{
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    },
  },
});

userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const password = this.get("password");
    if (typeof password === "string") {
      const hashed = await Hash.toHash(password);
      this.set("password", hashed);
    }
  }
  done();
});

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };

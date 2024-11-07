import mongoose from "mongoose";

interface UserAttrs {
  email: string;
  password: string;
  role: string;
}

interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
  role: string;
}

interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}


const userSchema = new mongoose.Schema({
  email: { type: String },
  password: { type: String },
  role: { type: String },
});

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };

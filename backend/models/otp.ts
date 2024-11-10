import mongoose from "mongoose";

interface OtpAttrs {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

interface OtpDoc extends mongoose.Document {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

interface OtpModel extends mongoose.Model<OtpDoc> {
  build(attrs: OtpAttrs): OtpDoc;
}

const otpSchema = new mongoose.Schema({
  email: { type: String },
  otp: { type: String },
  createdAt: { type: Date },
  expiresAt: { type: Date },
});

otpSchema.statics.build = (attrs: OtpAttrs) => {
  return new Otp(attrs);
};

const Otp = mongoose.model<OtpDoc, OtpModel>("Otp", otpSchema);

export { Otp };

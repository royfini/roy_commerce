import { User } from "../models/user";
import { deleteOTP, sendOTP, verifyOTP } from "./otp";

const sendVerificationOTPEmail = async (email: string) => {
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw Error("There is no account for the provided email");
  }

  const otpDetails = {
    email,
    subject: "Email Verification",
    message: "Verify your email with the code below",
    duration: 1,
  };
  const createdOTP = await sendOTP(otpDetails);
  return createdOTP;
};

const verifyUserEmail = async ({ email, otp }: { email: string; otp: string }) => {
  try {
      const validOTP = await verifyOTP({ email, otp });
      if (!validOTP) {
          throw Error("Invalid code passed. check your inbox");
      }
      //now update user record to show verified
      await User.updateOne({ email }, { verified: true });

      await deleteOTP(email);
      return;
  } catch (error) {
      throw error;
  }
}
export { sendVerificationOTPEmail, verifyUserEmail };

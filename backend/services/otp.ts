import { generateOTP } from "../utils/generateOtp";
import { Otp } from "../models/otp";
import { Hash } from "../utils/hash";
import { sendEmail } from "../utils/sendEmail";

const sendOTP = async ({
  email,
  subject,
  message,
  duration = 1,
}: {
  email: string;
  subject: string;
  message: string;
  duration?: number;
}) => {
  try {
    if (!(email && subject && message)) {
      throw Error("Provide values for email, subject, message");
    }

    //clear any old record
    await Otp.deleteOne({ email });

    //generated pin
    const generatedOTP = await generateOTP();

    //send email
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: subject,
      html: `<p>${message}</p><p style="color:black;fontsize:25px;letter-spacing:2px;"><b>${generatedOTP}<b/></p><p>expires in ${duration} hour(s)</p>`,
    };
    await sendEmail(mailOptions);

    //save otp record
    const hashedOTP = await Hash.toHash(generatedOTP);
    const newOTP = Otp.build({
      email,
      otp: hashedOTP,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000 * +duration),
    });

    const createdOTPRecord = await newOTP.save();
    return createdOTPRecord;
  } catch (error) {
    throw error;
  }
};

const verifyOTP = async ({ email, otp }: { email: string; otp: string }) => {
  try {
    if (!(email && otp)) {
      throw Error("Provide values for email, otp");
    }

    //ensure otp record exists
    const matchedOTPRecord = await Otp.findOne({
      email,
    });

    if (!matchedOTPRecord) {
      throw Error("No otp records found");
    }

    const { expiresAt } = matchedOTPRecord;

    //cheking for expired code
    if (expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ email });
      throw Error("Code has expired. Request for a new one");
    }

    //not verified yet, verify value
    const hashedOTP = matchedOTPRecord.otp;
    const validOTP = await Hash.compare(hashedOTP, otp);
    return validOTP;
  } catch (error) {
    throw error;
  }
};

const deleteOTP = async (email: string) => {
  try {
    await Otp.deleteOne({ email });
  } catch (error) {
    throw error;
  }
};

export { sendOTP, verifyOTP, deleteOTP };

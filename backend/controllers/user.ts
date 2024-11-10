import { Request, Response } from "express";
import { User } from "../models/user";
import { BadRequestError } from "../errors/bad-request-error";
import {
  sendVerificationOTPEmail,
  verifyUserEmail,
} from "../services/emailVerification";
import { Hash } from "../utils/hash";
import jwt from "jsonwebtoken";
import { io } from "../app";

export const createNewUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError("Email in use");
  }

  const user = User.build({
    email,
    password,
  });
  await user.save();

  await sendVerificationOTPEmail(email);

  res.status(201).send(user);
};

export const verifyUserToken = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await verifyUserEmail({ email, otp });
  res.status(200).send("Email verified");
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new BadRequestError("Invalid credentials");
  }
  const passwordsMatch = await Hash.compare(existingUser.password, password);
  if (!passwordsMatch) {
    throw new BadRequestError("Invalid Credentials");
  }

  // Generate JWT
  const userJwt = jwt.sign(
    {
      id: existingUser.id,
      email: existingUser.email,
    },
    process.env.JWT_KEY!
  );

  // Store it on session object
  req.session = {
    jwt: userJwt,
  };

  res.status(200).send(existingUser);
};

export const getUser = async (req: Request, res: Response) => {
  res.json({ id: req.currentUser?.id });
};

import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
import { createNewUser, getUser, loginUser, verifyUserToken } from "../controllers/user";
import { requireAuth } from "../middlewares/require-auth";

const userRouter = express.Router();

userRouter.post(
  "/add",
  [
    body("email").not().isEmpty().isEmail().withMessage("Email is required"),
    body("password").not().isEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  createNewUser
);

userRouter.post(
  "/verifyToken",
  [
    body("email").not().isEmpty().isEmail().withMessage("Email is required"),
    body("otp").not().isEmpty().withMessage("Otp is required"),
  ],
  validateRequest,
  verifyUserToken
);

userRouter.post(
  "/login",
  [
    body("email").not().isEmpty().isEmail().withMessage("Email is required"),
    body("password").not().isEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  loginUser
);

userRouter.get("/",requireAuth, getUser);

export { userRouter };

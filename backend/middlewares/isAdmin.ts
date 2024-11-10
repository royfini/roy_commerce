import { Request, Response, NextFunction } from "express";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { User } from "../models/user";
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  //find the user
  const userId = req?.currentUser?.id;
  const user = await User.findById(userId);
  //check if student
  if (user?.role === "admin") {
    next();
  } else {
    next(new Error("Access Denied, Admin only"));
  }
};

export {isAdmin}

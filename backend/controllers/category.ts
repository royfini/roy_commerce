import { Request, Response } from "express";
import { Category } from "../models/category";
import { BadRequestError } from "../errors/bad-request-error";

export const addCategory = async (req: Request, res: Response) => {
  const { name } = req.body;

  //check if name exist
  const existingCategory = await Category.findOne({ name: name });
  if (existingCategory) {
    throw new BadRequestError("Category already exist");
  }

  const category = Category.build({
    name,
  });

  await category.save();
  res.status(201).send(category);
};

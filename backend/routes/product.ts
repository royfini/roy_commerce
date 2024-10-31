import express from "express";
import { addProduct } from "../controllers/product";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
const productRouter = express.Router();

productRouter.post(
  "/add",
  [
    body("name").not().isEmpty().withMessage("Title is required"),
    body("description").not().isEmpty().withMessage("Description is required"),
    body("categoryId").not().isEmpty().withMessage("Category is required"),
    body("brandId").not().isEmpty().withMessage("Brand is required"),
    body("image").not().isEmpty().withMessage("Image is required"),
  ],
  validateRequest,
  addProduct
);

export { productRouter };

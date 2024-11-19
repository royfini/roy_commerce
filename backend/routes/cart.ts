import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
import {
  AddProductToCart,
  addQtyProductOfCart,
  checkOut,
  minusQtyProductOfCart,
} from "../controllers/cart";
import { requireAuth } from "../middlewares/require-auth";

const cartRouter = express.Router();

cartRouter.post(
  "/add-product",
  requireAuth,
  [body("productId").not().isEmpty().withMessage("Product is required")],
  validateRequest,
  AddProductToCart
);

cartRouter.post(
  "/add-product-qty",
  requireAuth,
  [body("productId").not().isEmpty().withMessage("Product is required")],
  validateRequest,
  addQtyProductOfCart
);

cartRouter.post(
  "/remove-product-qty",
  requireAuth,
  [body("productId").not().isEmpty().withMessage("Product is required")],
  minusQtyProductOfCart
);

cartRouter.post("/checkout", requireAuth, checkOut);

export { cartRouter };

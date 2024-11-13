import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
import {
  addProductQuantity,
  addProductToPurhase,
  createPurchase,
  getAllProductOfPurchase,
  getAllPurshases,
  removeProductQuantity,
  savePurshase,
} from "../controllers/purshase";
import { requireAuth } from "../middlewares/require-auth";
import { isAdmin } from "../middlewares/isAdmin";

const purchaseRouter = express.Router();

purchaseRouter.post("/create", requireAuth, isAdmin, createPurchase);

purchaseRouter.post(
  "/add-product/:id",
  requireAuth,
  isAdmin,
  [body("productId").not().isEmpty().withMessage("Product is required")],
  validateRequest,
  addProductToPurhase
);

purchaseRouter.get("/get-all", requireAuth, isAdmin, getAllPurshases);

purchaseRouter.get(
  "/get-all-product/:id",
  requireAuth,
  isAdmin,
  getAllProductOfPurchase
);

purchaseRouter.post(
  "/add-product-qty/:id",
  requireAuth,
  isAdmin,
  addProductQuantity
);
purchaseRouter.post(
  "/remove-product-qty/:id",
  requireAuth,
  isAdmin,
  removeProductQuantity
);

purchaseRouter.post("/save/:id", requireAuth, isAdmin, savePurshase);

export { purchaseRouter };

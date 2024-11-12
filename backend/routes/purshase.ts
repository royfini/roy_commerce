import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
import {
  addProductToPurhase,
  createPurchase,
  getAllProductOfPurchase,
  getAllPurshases,
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

purchaseRouter.get("/get-all-product/:id", requireAuth, isAdmin, getAllProductOfPurchase);

export { purchaseRouter };

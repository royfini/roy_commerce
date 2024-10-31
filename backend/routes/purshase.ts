import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
import { addProductToPurhase, createPurchase } from "../controllers/purshase";

const purchaseRouter = express.Router();

purchaseRouter.post(
  "/create",
  createPurchase
);

purchaseRouter.post(
  '/add-product/:id', 
  [
    body('productId').not().isEmpty().withMessage('Product is required')
  ],
  validateRequest,
  addProductToPurhase
);

export { purchaseRouter };
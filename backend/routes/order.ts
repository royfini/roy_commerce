import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { AddOrderInformation, PlaceOrder } from "../controllers/order";
import { requireAuth } from "../middlewares/require-auth";

const orderRouter = express.Router();

orderRouter.post(
  "/information",
  requireAuth,
  validateRequest,
  AddOrderInformation
);

orderRouter.post(
    "/place",
    requireAuth,
    validateRequest,
    PlaceOrder)

export {orderRouter};
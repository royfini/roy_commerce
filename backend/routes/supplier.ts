import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
import { addSupplier } from "../controllers/supplier";
const supplierRouter = express.Router();

supplierRouter.post(
  "/add",
  [body("name").not().isEmpty().withMessage("Name is required")],
  validateRequest,
  addSupplier
);

export { supplierRouter}
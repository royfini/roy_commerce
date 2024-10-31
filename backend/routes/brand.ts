import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
import { addBrand } from "../controllers/brand";
const brandRouter = express.Router();

brandRouter.post(
  "/add",
  [body("name").not().isEmpty().withMessage("Name is required")],
  validateRequest,
  addBrand
);

export { brandRouter }  

import express from "express";
import { validateRequest } from "../middlewares/validate-request";
import { body } from "express-validator";
const categoryRouter = express.Router();
import { addCategory } from "../controllers/category";

categoryRouter.post(
  "/add",
  [body("name").not().isEmpty().withMessage("Name is required")],
  validateRequest,
  addCategory
);

export { categoryRouter };

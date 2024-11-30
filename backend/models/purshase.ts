import mongoose from "mongoose";
import { Supplier } from "./supplier";
import { Product } from "./product";
import { Stock } from "./stock";
import { BadRequestError } from "../errors/bad-request-error";

interface PurchaseAttrs {
  user: string;
  supplier: string;
  purchaseDate: Date;
  totalPrice: number;
  status: string;
  products: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    previousQuantity?: number;
    totalPrice?: number;
    expiryDate?: Date;
  }>;
}

interface PurshaseDoc extends mongoose.Document {
  user: string;
  supplier: string;
  purchaseDate: Date;
  totalPrice: number;
  status: string;
  products: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    previousQuantity?: number;
    totalPrice?: number;
    expiryDate?: Date;
  }>;
}

interface PurshaseModel extends mongoose.Model<PurshaseDoc> {}

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    purchaseDate: { type: Date },
    totalPrice: { type: Number },
    status: { type: String,enum:["draft", "saved"], default: "draft"},
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number },
        previousQuantity: { type: Number, default: 0 }, // To store the old quantity
        totalPrice: { type: Number },
        expiryDate: { type: Date },
      },
    ],
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

const Purshase = mongoose.model<PurshaseDoc, PurshaseModel>(
  "Purshase",
  purchaseSchema
);

export { Purshase };

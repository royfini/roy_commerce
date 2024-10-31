import mongoose from "mongoose";
import { Supplier } from "./supplier";

interface PurchaseAttrs {
  user: string;
  supplier: string;
  purchaseDate: Date;
  totalPrice: number;
  products: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice?: number;
  }>;
}

interface PurshaseDoc extends mongoose.Document {
  user: string;
  supplier: string;
  purchaseDate: Date;
  totalPrice: number;
  products: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    totalPrice?: number;
  }>;
}

interface PurshaseModel extends mongoose.Model<PurshaseDoc> {}

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  purchaseDate: { type: Date },
  totalPrice: { type: Number },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number },
      totalPrice: { type: Number },
    },
  ],
});

const Purshase = mongoose.model<PurshaseDoc, PurshaseModel>(
  "Purshase",
  purchaseSchema
);

export { Purshase };

import mongoose from "mongoose";

import { BrandDoc } from "./brand"; // Adjust the import path as necessary
import { CategoryDoc } from "./category";

interface ProductAttrs {
  name: string;
  description: string;
  category: CategoryDoc;
  brand: BrandDoc;
  image: string;
  type: string;
  boxContent?: number;
  unitId?: mongoose.Types.ObjectId;
}

interface ProductDoc extends mongoose.Document {
  name: string;
  description: string;
  category: string;
  brand: string;
  image: string;
  type: string;
  boxContent?: number;
  unitId?: mongoose.Types.ObjectId;
}

interface ProductModel extends mongoose.Model<ProductDoc> {
  build(attrs: ProductAttrs): ProductDoc;
}

const produtSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  image: { type: String },
  type: { type: String, enum: ["box", "unit"], required: true }, // Differentiates box and unit
  boxContent: { type: Number, default: 0 }, // Number of units in the box; 0 for units
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // unit reference for box
},
{
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    },
  },
});

produtSchema.statics.build = (attrs: ProductAttrs) => {
  return new Product(attrs);
};

const Product = mongoose.model<ProductDoc, ProductModel>(
  "Product",
  produtSchema
);

export { Product };

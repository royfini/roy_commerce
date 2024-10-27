import mongoose from "mongoose";

import { BrandDoc } from "./brand"; // Adjust the import path as necessary
import { CategoryDoc } from "./category";

interface ProductAttrs {
  name: string;
  description: string;
  category: CategoryDoc;
  brand: BrandDoc;
  image: string;
}

interface ProductDoc extends mongoose.Document {
  name: string;
  description: string;
  category: string;
  brand: string;
  image: string;
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

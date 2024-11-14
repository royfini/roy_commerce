import mongoose from "mongoose";

interface PriceAttrs {
  purshasePrice?: number;
  sellerPrice: number;
  product: mongoose.Types.ObjectId;
}

interface PriceDoc extends mongoose.Document {
  purshasePrice?: number;
  sellerPrice: number;
  product: mongoose.Types.ObjectId;
}

interface PriceModel extends mongoose.Model<PriceDoc> {
  build(attr: PriceAttrs): PriceDoc;
}

const priceSchema = new mongoose.Schema({
  purshasePrice: { type: Number },
  sellerPrice: { type: Number },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
});

priceSchema.statics.build = (attr: PriceAttrs) => {
  return new Price(attr);
};

export const Price = mongoose.model<PriceDoc, PriceModel>("Price", priceSchema);

import mongoose from "mongoose";

interface StockAttrs {
  productId: mongoose.Types.ObjectId;
  quantityInStock: number;
  effectiveDate?: Date;
}

interface StockDoc extends mongoose.Document {
  productId: mongoose.Types.ObjectId;
  quantityInStock: number;
  effectiveDate?: Date;
}

interface StockModel extends mongoose.Model<StockDoc> {
  build(attrs: StockAttrs): StockDoc;
}

const stockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantityInStock: { type: Number, default: 0 },
  effectiveDate: { type: Date, default: Date.now },
});

stockSchema.statics.build = (attrs: StockAttrs) => {
  return new Stock(attrs);
};

const Stock = mongoose.model<StockDoc, StockModel>("Stock", stockSchema);

export { Stock };

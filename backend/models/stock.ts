import mongoose from "mongoose";

interface StockAttrs {
  productId: mongoose.Types.ObjectId;
  batch?:[{
    quantityInStock?: number;
    expiryDate?: Date;
    purchasePrice?: number;
  }]
}

interface StockDoc extends mongoose.Document {
  productId: mongoose.Types.ObjectId;
  batch?:[{
    quantityInStock?: number;
    expiryDate?: Date;
    purchasePrice?: number;
  }]
}

interface StockModel extends mongoose.Model<StockDoc> {
  build(attrs: StockAttrs): StockDoc;
}

const stockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  //quantityInStock: { type: Number, default: 0 },
  batch:[{
    quantityInStock: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true },
  }]
});

stockSchema.statics.build = (attrs: StockAttrs) => {
  return new Stock(attrs);
};

const Stock = mongoose.model<StockDoc, StockModel>("Stock", stockSchema);

export { Stock };

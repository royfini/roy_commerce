import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number },
      totalPrice: { type: Number },
    },
  ],
  totalPrice: { type: Number },
  quantity: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Cart = mongoose.model("Cart", cartSchema);

export { Cart };

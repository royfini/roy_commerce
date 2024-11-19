import mongoose from "mongoose";

interface CartAttrs {
  products: [
    {
      product: mongoose.Types.ObjectId;
      quantity: number;
      totalPrice: number;
    }
  ];
  totalPrice: number;
  quantity: number;
  user: mongoose.Types.ObjectId;
}

interface CartDoc extends mongoose.Document {
  products: [
    {
      product: mongoose.Types.ObjectId;
      quantity: number;
      totalPrice: number;
    }
  ];
  totalPrice: number;
  quantity: number;
  user: mongoose.Types.ObjectId;
}

interface CartModel extends mongoose.Model<CartDoc> {
  build(attr: CartAttrs): CartDoc;
}

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
},
{
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    },
  },
});

const Cart = mongoose.model<CartDoc, CartModel>("Cart", cartSchema);

cartSchema.statics.build = (attr: CartAttrs) => {
  return new Cart(attr);
};

export { Cart };

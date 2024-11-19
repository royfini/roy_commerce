import mongoose from "mongoose";

interface OrderAttrs {
  userId: mongoose.Types.ObjectId;
  products?: [
    {
      product: mongoose.Types.ObjectId;
      quantity: number;
      totalPrice: number;
    }
  ];
  orderType?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    phone: string;
  };
  totalPrice?: number;
  PaymentMethod?: string;
  deliveryPrice?: number;
  orderStatus?: string;
  placeAt?: Date;
  deliveryAt?: Date;
}

interface OrderDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  products: [
    {
      product: mongoose.Types.ObjectId;
      quantity: number;
      totalPrice: number;
    }
  ];
  orderType: string;
  deliveryAddress: {
    street: string;
    city: string;
    phone: string;
  };
  totalPrice: number;
  PaymentMethod: string;
  deliveryPrice: number;
  orderStatus: string;
  placeAt: Date;
  deliveryAt: Date;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attr: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number },
        totalPrice: { type: Number },
      },
    ],
    orderType: { enum: ["Delivery", "In Store Pick up"] },
    deliveryAddress: {
      street: { type: String },
      city: { type: String },
      phone: { type: String },
    },
    totalPrice: { type: Number },
    PaymentMethod: { enum: ["Cash"] },
    deliveryPrice: { type: Number },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Delivered", "Cancelled", "Completed"],
      default: "Pending",
    },
    placeAt: { type: Date, default: Date.now },
    deliveryAt: { type: Date },
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

orderSchema.statics.build = (attr: OrderAttrs) => {
  return new Order(attr);
};

const Order = mongoose.model<OrderDoc, OrderModel>("Order", orderSchema);

export { Order };

import Queue from "bull";
import { Order } from "../models/order";
import { BadRequestError } from "../errors/bad-request-error";
import { Stock } from "../models/stock";

interface Payload {
  orderId: string;
}

const expirationQueue = new Queue<Payload>("order:expiration", {
  redis: {
    host: process.env.REDIS_HOST,
    maxRetriesPerRequest: 100, // increase this value
  },
});

expirationQueue.process(async (job) => {
  //restock the products
  //console.log("i should restock products of order:", job.data.orderId)
  const order = await Order.findById(job.data.orderId);
  if (!order) {
    throw new BadRequestError("Order not found");
  }
  order.set({
    orderStatus: "Cancelled",
  });
  await order.save();
  for (let i = 0; i < order.products.length; i++) {
    const productInStock = await Stock.findOne({
      productId: order.products[i].product,
    });
    if (!productInStock) {
      throw new BadRequestError("Product not found in stock");
    }

    productInStock.quantityInStock += order.products[i].quantity;
  }
});

export { expirationQueue };

import Queue from "bull";
import { Order } from "../models/order";
import { BadRequestError } from "../errors/bad-request-error";
import { Stock } from "../models/stock";
import dotenv from "dotenv";
import { Product } from "../models/product";
dotenv.config();

interface Payload {
  orderId: string;
}

const expirationQueue = new Queue<Payload>("order:expiration", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  },
});

// Listen for the 'ready' event
expirationQueue.on("ready", () => {
  console.log("Bull queue connected to Redis successfully");
});

// Handle connection errors
expirationQueue.on("error", (error) => {
  console.error("Error connecting to Redis:", error);
});

expirationQueue.process(async (job) => {
  //restock the products
  console.log("Order expired", job.data.orderId);
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
    await productInStock.save();
  }
});

export { expirationQueue };

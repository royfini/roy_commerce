import { Request, Response } from "express";
import { Order } from "../models/order";
import { BadRequestError } from "../errors/bad-request-error";
import { expirationQueue } from "../utils/expiration";

const AddOrderInformation = async (req: Request, res: Response) => {
  const { orderType, deliveryAddress, PaymentMethod } = req.body;
  const userId = req.currentUser?.id ?? null;

  // Find the latest order for the user
  const latestOrder = await Order.findOne({ userId }).sort({ placeAt: -1 });
  if (!latestOrder) {
    throw new BadRequestError("No order found for the user");
  }
  if (latestOrder.orderStatus !== "Pending") {
    throw new BadRequestError("Order status is not pending");
  }
  if (orderType == "Delivery") {
    latestOrder.orderType = orderType;
    if (!deliveryAddress) {
      throw new BadRequestError("Delivery address is required");
    }
    if (!deliveryAddress.street || !deliveryAddress.city) {
      throw new BadRequestError("Delivery address is not valid");
    }
    //add delivery price
    latestOrder.deliveryPrice = 5;
    latestOrder.deliveryAddress.street = deliveryAddress.street;
    latestOrder.deliveryAddress.city = deliveryAddress.city;
  } else {
    latestOrder.orderType = orderType;
    latestOrder.deliveryPrice = 0;
  }
  latestOrder.PaymentMethod = PaymentMethod;

  // Ensure deliveryPrice and totalPrice are valid numbers
  const deliveryPrice = latestOrder.deliveryPrice || 0;
  const orderTotalPrice = latestOrder.totalPrice || 0;

  //add totlaPrice of order equal to deleveryPrice + totalPrice of products
  const totalPrice = +deliveryPrice + +orderTotalPrice;
  if (isNaN(totalPrice)) {
    throw new BadRequestError("Invalid totalPrice value");
  }
  latestOrder.totalPrice = totalPrice;
  await latestOrder.save();

  res.send("Order information added successfully");
};

const PlaceOrder = async (req: Request, res: Response) => {
  const userId = req.currentUser?.id ?? null;
  const latestOrder = await Order.findOne({ userId }).sort({ placeAt: -1 });
  if (!latestOrder) {
    throw new BadRequestError("No order found for the user");
  }
  if (latestOrder.orderStatus !== "Pending") {
    throw new BadRequestError("Order status is not pending");
  }
  console.log("latest order id:" + latestOrder.id);
  if (latestOrder.id) {
    const jobs = await expirationQueue.getJobs([
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
    ]);
    const job = jobs.find((job) => job.data.orderId === latestOrder.id);
    if (job) {
      await job.remove();
      console.log(
        `Job with ID ${latestOrder.id} has been removed from the expiration queue`
      );
    } else {
      throw new BadRequestError("Job not found in the expiration queue");
    }
  } else {
    throw new BadRequestError("Order ID is missing");
  }
  latestOrder.orderStatus = "Confirmed";
  await latestOrder.save();
  res.send("Order placed successfully");
};

export { AddOrderInformation, PlaceOrder };

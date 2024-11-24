import { Request, Response } from "express";
import { NotFoundError } from "../errors/not-found-error";
import { Cart } from "../models/cart";
import { Product } from "../models/product";
import { Price } from "../models/price";
import { io } from "../app";
import { Stock } from "../models/stock";
import { Order } from "../models/order";
import { expirationQueue } from "../utils/expiration";
import mongoose from "mongoose";
import { BadRequestError } from "../errors/bad-request-error";

const EXPIRATION_WINDOW_SECONDS = 0.5 * 60;

const AddProductToCart = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req?.currentUser?.id });
  if (!cart) {
    throw new NotFoundError();
  }
  //check if product exist
  const product = await Product.findById(productId);
  if (!product) {
    console.log("Product not found");
    throw new NotFoundError();
  }

  const price = await Price.findOne({ product: productId });
  const sellerPrice = price?.sellerPrice;
  if (!sellerPrice) {
    console.log("Price not found");
    throw new NotFoundError();
  }
  const existingProduct = cart.products.find(
    (p) => p.product.toString() === productId
  );

  if (existingProduct) {
    existingProduct.quantity += 1;
    existingProduct.totalPrice = existingProduct.quantity * sellerPrice;
    cart.totalPrice = cart.totalPrice + sellerPrice;
  } else {
    cart.products.push({
      product: productId,
      quantity: 1,
      totalPrice: sellerPrice,
    });
    cart.totalPrice = cart.totalPrice + sellerPrice;
  }

  await cart.save();
  res.send(cart);
};

const addQtyProductOfCart = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req?.currentUser?.id });
  if (!cart) {
    throw new NotFoundError();
  }
  const existingProduct = cart.products.find(
    (p) => p.product.toString() === productId
  );

  const price = await Price.findOne({ product: productId });
  const sellerPrice = price?.sellerPrice;
  if (!sellerPrice) {
    console.log("Price not found");
    throw new NotFoundError();
  }
  if (existingProduct) {
    existingProduct.quantity += 1;
    existingProduct.totalPrice = existingProduct.quantity * sellerPrice;
    cart.totalPrice = cart.totalPrice + sellerPrice;
  } else {
    throw new NotFoundError();
  }
  await cart.save();
  const populatedCart = await cart.populate("products.product");
  if (req.currentUser) {
    io.to(`private-room-${req.currentUser.id}`).emit(
      "productPlusToCart",
      populatedCart.products
    );
  }
  res.send("Product added to cart");
};

const minusQtyProductOfCart = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req?.currentUser?.id });
  if (!cart) {
    throw new NotFoundError();
  }
  const existingProduct = cart.products.find(
    (p) => p.product.toString() === productId
  );
  const price = await Price.findOne({ product: productId });
  const sellerPrice = price?.sellerPrice;
  if (!sellerPrice) {
    console.log("Price not found");
    throw new NotFoundError();
  }

  if (existingProduct) {
    if (existingProduct.quantity > 0) {
      existingProduct.quantity -= 1;
      existingProduct.totalPrice = existingProduct.quantity * sellerPrice;
      cart.totalPrice = cart.totalPrice - sellerPrice;
    }
  } else {
    throw new NotFoundError();
  }
  await cart.save();
  const populatedCart = await cart.populate("products.product");
  if (req.currentUser) {
    io.to(`private-room-${req.currentUser.id}`).emit(
      "productMinusToCart",
      populatedCart.products
    );
  }
  res.send("Product removed from cart");
};

const checkOut = async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ user: req?.currentUser?.id });
  if (!cart) {
    throw new BadRequestError("Cart not found");
  }
  for (let i = 0; i < cart.products.length; i++) {
    const product = await Product.findById(cart.products[i].product);
    if (!product) {
      throw new BadRequestError("Product not found");
    }
    const productInStock = await Stock.findOne({
      productId: cart.products[i].product,
    });
    if (!productInStock) {
      throw new BadRequestError("Product not found in stock");
    }

    // Check product quantity available in stock
    if (product.type === "unit") {
      const totalUnitsRequired = cart.products[i].quantity;

      if (productInStock.quantityInStock < totalUnitsRequired) {
        throw new BadRequestError("Product out of stock");
      }
      productInStock.quantityInStock -= totalUnitsRequired;

      // Query for a box containing the given unit
      const box = await Product.findOne({
        type: "box",
        unitId: product.id,
      }).exec();

      if (box) {
        //Check if we need to decrease box quantity
        if (box.boxContent! > 0) {
          const boxesToDecrease = Math.ceil(
            totalUnitsRequired / box.boxContent!
          );
          if (boxesToDecrease > 0) {
            const boxProductInStock = await Stock.findOne({
              productId: box.id,
            });
            if (!boxProductInStock) {
              throw new BadRequestError("Box product not found in stock");
            }
            if (boxProductInStock.quantityInStock < boxesToDecrease) {
              throw new BadRequestError("Box product out of stock");
            }
            boxProductInStock.quantityInStock -= boxesToDecrease;
            await boxProductInStock.save();
          }
        }
      } else {
        console.log("No box contains this unit.");
      }
    } else if (product.type === "box") {
      const totalUnitsRequired =
        cart.products[i].quantity * product.boxContent!;
      if (productInStock.quantityInStock < cart.products[i].quantity) {
        throw new BadRequestError("Product out of stock");
      }
      productInStock.quantityInStock -= cart.products[i].quantity;

      const unitProductInStock = await Stock.findOne({
        productId: product.unitId,
      });
      if (!unitProductInStock) {
        throw new BadRequestError("Unit product not found in stock");
      }
      if (unitProductInStock.quantityInStock < totalUnitsRequired) {
        throw new BadRequestError("Unit product out of stock");
      }
      unitProductInStock.quantityInStock -= totalUnitsRequired;
      await unitProductInStock.save();
    }
    await productInStock.save();
  }
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);
  const delay = new Date(expiration).getTime() - new Date().getTime();
  console.log("Waiting this many milliseconds to process the job", delay);

  if (!req.currentUser) {
    throw new Error("User not authenticated");
  }
  const userId = new mongoose.Types.ObjectId(req.currentUser.id);
  const order = Order.build({
    userId: userId,
    products: cart.products,
    totalPrice: cart.totalPrice,
  });
  await order.save();
  console.log("Order id:" + order.id);

  await expirationQueue.add(
    {
      orderId: order.id, // Payload data
    },
    {
      delay,
    }
  );

  res.send("checkout successful");
};

export {
  AddProductToCart,
  addQtyProductOfCart,
  minusQtyProductOfCart,
  checkOut,
};

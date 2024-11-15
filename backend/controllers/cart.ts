import { Request, Response } from "express";
import { NotFoundError } from "../errors/not-found-error";
import { Cart } from "../models/cart";
import { Product } from "../models/product";
import { Price } from "../models/price";
import { io } from "../app";
import { Stock } from "../models/stock";

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
  } else {
    cart.products.push({
      product: productId,
      quantity: 1,
      totalPrice: sellerPrice,
    });
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
    throw new NotFoundError();
  }
  for (let i = 0; i < cart.products.length; i++) {
    const productInStock = await Stock.findOne({
      product: cart.products[i].product,
    });
    if (!productInStock) {
      throw new NotFoundError();
    }
    //check product quantity available in stock
    if (productInStock.quantityInStock < cart.products[i].quantity) {
      throw new NotFoundError();
    }
    productInStock.quantityInStock -= cart.products[i].quantity;
    await productInStock.save();
  }
};

export { AddProductToCart, addQtyProductOfCart, minusQtyProductOfCart };

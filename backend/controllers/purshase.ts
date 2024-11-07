import { Request, Response } from "express";
import { Purshase } from "../models/purshase";
import { Supplier } from "../models/supplier";
import { NotFoundError } from "../errors/not-found-error";
import { Product } from "../models/product";
import mongoose from "mongoose";
import { io } from "../app";

const createPurchase = async (req: Request, res: Response) => {
  const newPurshase = new Purshase();
  await newPurshase.save();
  res.status(201).send(newPurshase);
};

const addSupplierToPurchase = async (req: Request, res: Response) => {
  const { supplierId } = req.body;

  //check if supplier exist
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new NotFoundError();
  }

  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new NotFoundError();
  }
  purshase.supplier = supplierId;
  res.status(201).send(purshase);
};

const addProductToPurhase = async (req: Request, res: Response) => {
  const { productId } = req.body;

  //get use id (in normal we get it from token middleware req.id)

  //check if product exist
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError();
  }
  // Ensure productId is an ObjectId
  const productObjectId = new mongoose.Types.ObjectId(productId);
  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new NotFoundError();
  }

  const existingProduct = purshase.products.find(
    (p) => p.product.toString() === productId
  );

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    purshase.products.push({
      product: productObjectId,
      quantity: 1,
    });
  }

  await purshase.save();
 
  const populatedPurshase = await purshase.populate('products.product');
  //io.to(req.user.id).emit("productAddedTopurshase", populatedPurshase.products);
  io.emit("productAddedTopurshase", populatedPurshase.products);
  res.send("Product added to purshase");
};

export { createPurchase, addSupplierToPurchase, addProductToPurhase };

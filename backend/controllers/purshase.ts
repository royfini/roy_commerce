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
  if (req.currentUser) {
    io.to(`private-room-${req.currentUser.id}`).emit(
      "add_purchase",
      newPurshase
    );
  }
  res.status(201).send("Purshase created");
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

  const populatedPurshase = await purshase.populate("products.product");
  if (req.currentUser) {
    io.to(`private-room-${req.currentUser.id}`).emit(
      "productAddedToPurshase",
      populatedPurshase.products
    );
  }
  res.send("Product added to purshase");
};

const getAllPurshases = async (req: Request, res: Response) => {
  const purshases = await Purshase.find();
  res.send(purshases);
};

const getAllProductOfPurchase = async (req: Request, res: Response) => {
  const purshase = await Purshase.findById(req.params.id).populate(
    "products.product"
  );
  if (!purshase) {
    throw new NotFoundError();
  }
  res.send(purshase.products);
};

const addProductQuantity = async (req: Request, res: Response) => {};

const removeProductQuantity = async (req: Request, res: Response) => {};

export {
  createPurchase,
  addSupplierToPurchase,
  addProductToPurhase,
  getAllPurshases,
  getAllProductOfPurchase,
};

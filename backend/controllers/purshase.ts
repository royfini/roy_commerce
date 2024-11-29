import { Request, Response } from "express";
import { Purshase } from "../models/purshase";
import { Supplier } from "../models/supplier";
import { NotFoundError } from "../errors/not-found-error";
import { Product } from "../models/product";
import mongoose from "mongoose";
import { io } from "../app";
import { Stock } from "../models/stock";
import { BadRequestError } from "../errors/bad-request-error";
import { Price } from "../models/price";

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
    res.send("Product already added to purshase");
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

const addProductQuantity = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new NotFoundError();
  }

  const existingProduct = purshase.products.find(
    (p) => p.product.toString() === productId
  );

  if (existingProduct) {
    if(purshase.status === "saved") {
      existingProduct.previousQuantity = existingProduct.quantity;
    }
    existingProduct.quantity += 1;
  } else {
    throw new NotFoundError();
  }
  purshase.status = "draft";
  await purshase.save();
  const populatedPurshase = await purshase.populate("products.product");
  if (req.currentUser) {
    io.to(`private-room-${req.currentUser.id}`).emit(
      "productPlusToPurshase",
      populatedPurshase.products
    );
  }
  res.send("Product added to purshase");
};

const removeProductQuantity = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new NotFoundError();
  }

  const existingProduct = purshase.products.find(
    (p) => p.product.toString() === productId
  );

  if (existingProduct) {
    if(purshase.status === "saved") {
      existingProduct.previousQuantity = existingProduct.quantity;
    }
    if (existingProduct.quantity > 0) {
      existingProduct.quantity -= 1;
    }
  } else {
    throw new NotFoundError();
  }
  purshase.status = "draft";
  await purshase.save();
  const populatedPurshase = await purshase.populate("products.product");
  if (req.currentUser) {
    io.to(`private-room-${req.currentUser.id}`).emit(
      "productRemoveFromPurshase",
      populatedPurshase.products
    );
  }
  res.send("Product removed from purshase");
};

const savePurshase = async (req: Request, res: Response) => {
  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new NotFoundError();
  }

  if (purshase.status === "saved") {
    throw new BadRequestError("Purchase is already saved.");
  }

  for (const product of purshase.products) {
    const productInfo = await Product.findById(product.product);
    if (!productInfo) {
      throw new NotFoundError();
    }
    const productPrice = await Price.findById(product.product);
    if(!productPrice) {
      throw new NotFoundError();
    }
    const stockProduct = await Stock.findOne({ productId: product.product });
    if (stockProduct) {
      const quantityDifference = product.quantity - product.previousQuantity!;
      //stockProduct.quantityInStock += quantityDifference;
      stockProduct.batch?.push({
        quantityInStock: quantityDifference,
        expiryDate: new Date(),
        purchasePrice: productPrice.purshasePrice? productPrice.purshasePrice : 0,
      });
      // Clear previousQuantity and mark as saved
      product.previousQuantity = 0;
      await stockProduct.save();
      if (productInfo.type === "box") {
        const unitProduct = await Stock.findOne({
          productId: productInfo.unitId,
        });
        if (unitProduct) {
          // unitProduct.quantityInStock +=
          //   quantityDifference * productInfo.boxContent!;
          unitProduct.batch?.push({
            quantityInStock: quantityDifference * productInfo.boxContent!,
            expiryDate: new Date(),
            purchasePrice: productPrice.purshasePrice? productPrice.purshasePrice : 0,
          });
          await unitProduct.save();
        }
      }
    } else {
      // Handle case where product is not found in stock
      throw new NotFoundError();
    }
  }
  purshase.purchaseDate = new Date();
  purshase.status = "saved";
  await purshase.save();
  res.send("Purshase saved and stock updated");
};

export {
  createPurchase,
  addSupplierToPurchase,
  addProductToPurhase,
  getAllPurshases,
  getAllProductOfPurchase,
  savePurshase,
  addProductQuantity,
  removeProductQuantity,
};

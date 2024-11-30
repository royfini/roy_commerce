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
    if (purshase.status === "saved") {
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
    if (purshase.status === "saved") {
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

const addProductExpiry = async (req: Request, res: Response) => {
  const { productId, expiryDate } = req.body;
  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new NotFoundError();
  }

  const existingProduct = purshase.products.find(
    (p) => p.product.toString() === productId
  );

  if (existingProduct) {
    existingProduct.expiryDate = expiryDate;
  } else {
    throw new NotFoundError();
  }
  purshase.status = "draft";
  await purshase.save();
  res.send("Product expiry date added to purshase");
};

const savePurshase = async (req: Request, res: Response) => {
  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new BadRequestError("Purchase not found");
  }

  if (purshase.status === "saved") {
    throw new BadRequestError("Purchase is already saved.");
  }

  for (const product of purshase.products) {
    const productInfo = await Product.findById(product.product);
    if (!productInfo) {
      throw new BadRequestError("Product not found");
    }
    const productPrice = await Price.findOne({ product: product.product });
    if (!productPrice) {
      throw new BadRequestError("Price not found");
    }
    const stockProduct = await Stock.findOne({ productId: product.product });
    if (stockProduct) {
      const quantityDifference = product.quantity - product.previousQuantity!;
      stockProduct.quantityInStock += quantityDifference;

      const batchIndex = stockProduct.batch?.findIndex(
        (b) =>
          b &&
          b.purchasePrice === productPrice.purshasePrice &&
          b.expiryDate === product.expiryDate
      );

      if (batchIndex !== -1) {
        if (batchIndex !== undefined) {
          if (stockProduct.batch && stockProduct.batch[batchIndex]) {
            stockProduct.batch[batchIndex].expiryDate = product.expiryDate!;
            stockProduct.batch[batchIndex].quantityInStock! +=
              quantityDifference;
          }
        }
      } else {
        stockProduct.batch?.push({
          quantityInStock: quantityDifference,
          expiryDate: product.expiryDate ? product.expiryDate : new Date(),
          purchasePrice: productPrice.purshasePrice,
        });
      }
      // Clear previousQuantity and mark as saved
      product.previousQuantity = 0;
      await stockProduct.save();
      if (productInfo.type === "box") {
        const unitProduct = await Stock.findOne({
          productId: productInfo.unitId,
        });
        const unitProductPrice = await Price.findOne({
          product: productInfo.unitId,
        });
        if (unitProduct && unitProductPrice) {
          unitProduct.quantityInStock +=
            quantityDifference * productInfo.boxContent!;

          //i want to check in batch array if quantity and price the same but expiry not so i want to change expiry
          const batchIndexExpiry = stockProduct.batch?.findIndex(
            (b) =>
              b &&
              b.quantityInStock === product.quantity &&
              b.purchasePrice === productPrice.purshasePrice &&
              b.expiryDate !== product.expiryDate
          );
          //same for if price the same and expiry the same so i want to change quantity
          const batchIndexQuantity = stockProduct.batch?.findIndex(
            (b) =>
              b &&
              b.quantityInStock !== product.quantity &&
              b.expiryDate === product.expiryDate &&
              b.purchasePrice === productPrice.purshasePrice
          );
          //same if quantity and expiry the same so i want to change price
          const batchIndexPrice = stockProduct.batch?.findIndex(
            (b) =>
              b &&
              b.quantityInStock === product.quantity &&
              b.expiryDate === product.expiryDate &&
              b.purchasePrice !== productPrice.purshasePrice
          );
          if (batchIndexExpiry !== -1) {
            if (batchIndexExpiry !== undefined) {
              if (stockProduct.batch && stockProduct.batch[batchIndexExpiry]) {
                stockProduct.batch[batchIndexExpiry].expiryDate =
                  product.expiryDate ? product.expiryDate : new Date();
              }
            }
          } else if (batchIndexQuantity !== -1) {
            if (batchIndexQuantity !== undefined) {
              if (
                stockProduct.batch &&
                stockProduct.batch[batchIndexQuantity]
              ) {
                stockProduct.batch[batchIndexQuantity].quantityInStock! +=
                  quantityDifference * productInfo.boxContent!;
              }
            }
          } else if (batchIndexPrice !== -1) {
            if (batchIndexPrice !== undefined) {
              if (stockProduct.batch && stockProduct.batch[batchIndexPrice]) {
                stockProduct.batch[batchIndexPrice].purchasePrice =
                  unitProductPrice.purshasePrice;
              }
            }
          } else {
            unitProduct.batch?.push({
              quantityInStock: quantityDifference * productInfo.boxContent!,
              expiryDate: product.expiryDate ? product.expiryDate : new Date(),
              purchasePrice: unitProductPrice.purshasePrice,
            });
          }
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

const addPurchase = async (req: Request, res: Response) => {
  const { products } = req.body;
  const purshase = await Purshase.findById(req.params.id);
  if (!purshase) {
    throw new BadRequestError("Purchase not found");
  }
  purshase.products = products;
  for (const product of products) {
    const productInfo = await Product.findById(product.product);
    if (!productInfo) {
      throw new BadRequestError("Product not found");
    }
    const productPrice = await Price.findOne({ product: product.product });
    if (!productPrice) {
      throw new BadRequestError("Price not found");
    }
    const stockProduct = await Stock.findOne({ productId: product.product });
    if (stockProduct) {
      const quantityPurchase = purshase.products.find(
        (p) => p.product.toString() === product.product
      )?.quantity;
      const quantityDifference = product.quantity - (quantityPurchase ?? 0);

      stockProduct.quantityInStock += quantityDifference;
      const batchIndex = stockProduct.batch?.findIndex(
        (b) =>
          b &&
          b.purchasePrice === productPrice.purshasePrice &&
          b.expiryDate === product.expiryDate
      );

      if (batchIndex !== -1) {
        if (batchIndex !== undefined) {
          if (stockProduct.batch && stockProduct.batch[batchIndex]) {
            stockProduct.batch[batchIndex].expiryDate = product.expiryDate!;
            stockProduct.batch[batchIndex].quantityInStock! +=
              quantityDifference;
          }
        }
      } else {
        stockProduct.batch?.push({
          quantityInStock: quantityDifference,
          expiryDate: product.expiryDate ? product.expiryDate : new Date(),
          purchasePrice: productPrice.purshasePrice,
        });
      }
      await stockProduct.save();
      if (productInfo.type === "box") {
        const unitProduct = await Stock.findOne({
          productId: productInfo.unitId,
        });
        const unitProductPrice = await Price.findOne({
          product: productInfo.unitId,
        });
        if (unitProduct && unitProductPrice) {
          unitProduct.quantityInStock +=
            quantityDifference * productInfo.boxContent!;

          const batchIndex = stockProduct.batch?.findIndex(
            (b) =>
              b &&
              b.purchasePrice === productPrice.purshasePrice &&
              b.expiryDate === product.expiryDate
          );

          if (batchIndex !== -1) {
            if (batchIndex !== undefined) {
              if (unitProduct.batch && unitProduct.batch[batchIndex]) {
                unitProduct.batch[batchIndex].expiryDate = product.expiryDate!;
                unitProduct.batch[batchIndex].quantityInStock! +=
                  quantityDifference * productInfo.boxContent!;
              }
            }
          } else {
            unitProduct.batch?.push({
              quantityInStock: quantityDifference * productInfo.boxContent!,
              expiryDate: product.expiryDate ? product.expiryDate : new Date(),
              purchasePrice: unitProductPrice.purshasePrice,
            });
          }
          await unitProduct.save();
        }
      }
    }
  }
  await purshase.save();
  res.send("Purshase saved and stock updated");
};

const editPurchase = async (req: Request, res: Response) => {
  const { products } = req.body;
  const purshase = await Purshase.findById(req.params.id);

  if (!purshase) {
    throw new BadRequestError("Purchase not found");
  }

  for (const newProduct of products) {
    const existingProduct = purshase.products.find(
      (p) => p.product.toString() === newProduct.product.toString()
    );

    if (existingProduct) {
      const stockProduct = await Stock.findOne({ productId: newProduct.product });
      if (!stockProduct) {
        throw new BadRequestError("Product not found in stock");
      }

      const quantityDifference = newProduct.quantity - existingProduct.quantity;

      // Update stock quantity
      stockProduct.quantityInStock += quantityDifference;

      // Update batch information
      const batchIndex = stockProduct.batch?.findIndex(
        (b) =>
          b &&
          b.purchasePrice === newProduct.purchasePrice &&
          b.expiryDate === existingProduct.expiryDate
      );

      if (batchIndex !== -1 && batchIndex !== undefined) {
        if (stockProduct.batch && stockProduct.batch[batchIndex]) {
          stockProduct.batch[batchIndex].quantityInStock! -= existingProduct.quantity;
          stockProduct.batch[batchIndex].quantityInStock! += newProduct.quantity;
          stockProduct.batch[batchIndex].expiryDate = newProduct.expiryDate;
        }
      } else {
        stockProduct.batch?.push({
          quantityInStock: newProduct.quantity,
          expiryDate: newProduct.expiryDate ? newProduct.expiryDate : new Date(),
          purchasePrice: newProduct.purchasePrice,
        });
      }

      await stockProduct.save();
    } else {
      throw new BadRequestError("Product not found in purchase");
    }
  }

  // Update purchase with new product details
  purshase.products = products;
  await purshase.save();

  res.send("Purchase updated successfully");
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
  addProductExpiry,
  addPurchase,
  editPurchase,
};

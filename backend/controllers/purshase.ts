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
    // Step 2: Add or update stock with new purchase details
    const updated = await Stock.updateOne(
      {
        productId: product.product,
        "batch.expiryDate": product.expiryDate,
        "batch.purchasePrice": productPrice.purshasePrice,
      },
      { $inc: { "batch.$.quantityInStock": product.quantity } }
    );

    if (updated.matchedCount === 0) {
      // If no matching batch, create a new one
      await Stock.updateOne(
        { productId: product.product },
        {
          $push: {
            batch: {
              expiryDate: product.expiryDate,
              purchasePrice: productPrice.purshasePrice,
              quantityInStock: product.quantity,
            },
          },
        }
      );
    }
    await Stock.updateOne(
      { productId: product.product },
      { $inc: { quantityInStock: product.quantity } }
    );
    if (productInfo.type === "unit") {
      const totalUnitsRequired = product.quantity;
      // Query for a box containing the given unit
      const box = await Product.findOne({
        type: "box",
        unitId: product.product,
      }).exec();
      if (box) {
        //Check if we need to decrease box quantity
        if (box.boxContent! > 0) {
          const boxesToDecrease = totalUnitsRequired / box.boxContent!;

          if (boxesToDecrease > 0) {
            const boxProductInStock = await Stock.findOne({
              productId: box.id,
            });
            if (!boxProductInStock) {
              throw new BadRequestError("Box product not found in stock");
            }
            const result = parseFloat(
              (productPrice.purshasePrice! * box.boxContent!).toFixed(5)
            );
            const updated = await Stock.updateOne(
              {
                productId: box.id,
                "batch.expiryDate": product.expiryDate,
                "batch.purchasePrice": result,
              },
              {
                $inc: {
                  "batch.$.quantityInStock": boxesToDecrease,
                },
              }
            );
            if (updated.matchedCount === 0) {
              // If no matching batch, create a new one
              const result = parseFloat(
                (productPrice.purshasePrice! * box.boxContent!).toFixed(5)
              );
              await Stock.updateOne(
                { productId: box.id },
                {
                  $push: {
                    batch: {
                      expiryDate: product.expiryDate,
                      purchasePrice: result,
                      quantityInStock: boxesToDecrease,
                    },
                  },
                }
              );
            }
          }
          await Stock.updateOne(
            { productId: box.id },
            { $inc: { quantityInStock: boxesToDecrease } }
          );
        }
      } else {
        throw new BadRequestError("No box contains this unit.");
      }
    }
    if (productInfo.type === "box") {
      const unitProduct = await Stock.findOne({
        productId: productInfo.unitId,
      });
      const unitProductPrice = await Price.findOne({
        product: productInfo.unitId,
      });
      if (unitProduct && unitProductPrice) {
        const result = parseFloat(
          (product.purchasePrice / productInfo.boxContent!).toFixed(5)
        );
        const updated = await Stock.updateOne(
          {
            productId: productInfo.unitId,
            "batch.expiryDate": product.expiryDate,
            "batch.purchasePrice": result,
          },
          {
            $inc: {
              "batch.$.quantityInStock":
                product.quantity * productInfo.boxContent!,
            },
          }
        );
        if (updated.matchedCount === 0) {
          // If no matching batch, create a new one
          const result = parseFloat(
            (product.purchasePrice / productInfo.boxContent!).toFixed(5)
          );
          await Stock.updateOne(
            { productId: productInfo.unitId },
            {
              $push: {
                batch: {
                  expiryDate: product.expiryDate,
                  purchasePrice: result,
                  quantityInStock: product.quantity * productInfo.boxContent!,
                },
              },
            }
          );
        }
        await Stock.updateOne(
          { productId: productInfo.unitId },
          {
            $inc: {
              quantityInStock: product.quantity * productInfo.boxContent!,
            },
          }
        );
      }
    }
  }
  await purshase.save();
  res.send("Purshase saved and stock updated");
};

const editPurchase = async (req: Request, res: Response) => {
  const { products } = req.body;
  const originalPurchase = await Purshase.findById(req.params.id);

  if (!originalPurchase) {
    throw new BadRequestError("Purchase not found");
  }

  for (const product of originalPurchase.products) {
    const productInfo = await Product.findById(product.product);
    if (!productInfo) {
      throw new BadRequestError("Product not found");
    }
    // Step 1: Reverse original purchase
    const formattedExpiryDate = new Date(product.expiryDate!).toISOString();
    const stockUpdateResult = await Stock.updateOne(
      {
        productId: product.product,
        "batch.expiryDate": formattedExpiryDate,
        "batch.purchasePrice": product.purchasePrice,
      },
      { $inc: { "batch.$.quantityInStock": -product.quantity } }
    );
    await Stock.updateOne(
      {
        productId: product.product,
      },
      { $inc: { quantityInStock: -product.quantity } }
    );

    if (stockUpdateResult.modifiedCount > 0) {
      // Check if the batch now has quantityInStock = 0
      await Stock.updateOne(
        {
          productId: product.product,
          "batch.expiryDate": product.expiryDate,
          "batch.purchasePrice": product.purchasePrice,
          "batch.quantityInStock": 0,
        },
        {
          $pull: {
            batch: {
              expiryDate: formattedExpiryDate,
              purchasePrice: product.purchasePrice,
            },
          },
        }
      );
    }
    if (productInfo.type === "unit") {
      const totalUnitsRequired = product.quantity;
      // Query for a box containing the given unit
      const box = await Product.findOne({
        type: "box",
        unitId: product.product,
      }).exec();
      if (box) {
        //Check if we need to decrease box quantity
        if (box.boxContent! > 0) {
          const boxesToDecrease = totalUnitsRequired / box.boxContent!;

          if (boxesToDecrease > 0) {
            const boxProductInStock = await Stock.findOne({
              productId: box.id,
            });
            if (!boxProductInStock) {
              throw new BadRequestError("Box product not found in stock");
            }
            const result = parseFloat(
              (product.purchasePrice! * box.boxContent!).toFixed(5)
            );
            const updated = await Stock.updateOne(
              {
                productId: box.id,
                "batch.expiryDate": formattedExpiryDate,
                "batch.purchasePrice": result,
              },
              {
                $inc: {
                  "batch.$.quantityInStock": -boxesToDecrease,
                },
              }
            );
            if (updated.matchedCount > 0) {
              // Check if the batch now has quantityInStock = 0
              await Stock.updateOne(
                {
                  productId: box.id,
                  "batch.expiryDate": formattedExpiryDate,
                  "batch.purchasePrice": result,
                  "batch.quantityInStock": 0,
                },
                {
                  $pull: {
                    batch: {
                      expiryDate: formattedExpiryDate,
                      purchasePrice: result,
                    },
                  },
                }
              );
            }
          }
          await Stock.updateOne(
            {
              productId: box.id,
            },
            { $inc: { quantityInStock: -product.quantity } }
          );
        }
      } else {
        throw new BadRequestError("No box contains this unit.");
      }
    }
    if (productInfo.type === "box") {
      const unitProduct = await Stock.findOne({
        productId: productInfo.unitId,
      });
      if (unitProduct) {
        const result = parseFloat(
          (product.purchasePrice! / productInfo.boxContent!).toFixed(5)
        );
        const stockUpdateResult = await Stock.updateOne(
          {
            productId: productInfo.unitId,
            "batch.expiryDate": formattedExpiryDate,
            "batch.purchasePrice": result,
          },
          {
            $inc: {
              "batch.$.quantityInStock":
                -product.quantity * productInfo.boxContent!,
            },
          }
        );
        if (stockUpdateResult.modifiedCount > 0) {
          // Check if the batch now has quantityInStock = 0
          await Stock.updateOne(
            {
              productId: productInfo.unitId,
              "batch.expiryDate": formattedExpiryDate,
              "batch.purchasePrice": result,
              "batch.quantityInStock": 0,
            },
            {
              $pull: {
                batch: {
                  expiryDate: formattedExpiryDate,
                  purchasePrice: result,
                },
              },
            }
          );
        }
        await Stock.updateOne(
          {
            productId: productInfo.unitId,
          },
          { $inc: { quantityInStock: -product.quantity } }
        );
      }
    }
    for (const product of products) {
      const productInfo = await Product.findById(product.product);
      if (!productInfo) {
        throw new BadRequestError("Product not found");
      }
      const productPrice = await Price.findOne({ product: product.product });
      if (!productPrice) {
        throw new BadRequestError("Price not found");
      }
      // Step 2: Add or update stock with new purchase details
      const formattedExpiryDate = new Date(product.expiryDate!).toISOString();
      const updated = await Stock.updateOne(
        {
          productId: product.product,
          "batch.expiryDate": formattedExpiryDate,
          "batch.purchasePrice": productPrice.purshasePrice,
        },
        { $inc: { "batch.$.quantityInStock": product.quantity } }
      );

      if (updated.matchedCount === 0) {
        // If no matching batch, create a new one
        await Stock.updateOne(
          { productId: product.product },
          {
            $push: {
              batch: {
                expiryDate: product.expiryDate,
                purchasePrice: product.purchasePrice,
                quantityInStock: product.quantity,
              },
            },
          }
        );
      }
      if (productInfo.type === "box") {
        const unitProduct = await Stock.findOne({
          productId: productInfo.unitId,
        });
        if (unitProduct) {
          const updated = await Stock.updateOne(
            {
              productId: productInfo.unitId,
              "batch.expiryDate": formattedExpiryDate,
              "batch.purchasePrice": product.purchasePrice
                ? product.purchasePrice / productInfo.boxContent!
                : 0,
            },
            {
              $inc: {
                "batch.$.quantityInStock":
                  product.quantity * productInfo.boxContent!,
              },
            }
          );
          if (updated.matchedCount === 0) {
            // If no matching batch, create a new one
            await Stock.updateOne(
              { productId: productInfo.unitId },
              {
                $push: {
                  batch: {
                    expiryDate: product.expiryDate,
                    purchasePrice: product.purchasePrice,
                    quantityInStock: product.quantity * productInfo.boxContent!,
                  },
                },
              }
            );
          }
        }
      }
    }
  }
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

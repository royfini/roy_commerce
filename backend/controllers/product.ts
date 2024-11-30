import { Request, Response } from "express";
import { NotFoundError } from "../errors/not-found-error";
import { Brand } from "../models/brand";
import { Category } from "../models/category";
import { Product } from "../models/product";
import { io } from "../app";
import { Stock } from "../models/stock";
import { Price } from "../models/price";

export const addProduct = async (req: Request, res: Response) => {
  const {
    name,
    description,
    categoryId,
    brandId,
    image,
    sellerPrice,
    purchasePrice,
    type,
    boxContent,
    unitId,
  } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError();
  }
  const brand = await Brand.findById(brandId);
  if (!brand) {
    throw new NotFoundError();
  }

  //check if name exist
  const existingProduct = await Product.findOne({ where: { name } });
  if (existingProduct) {
    throw new Error("Product already exist");
  }

  const product = Product.build({
    name,
    description,
    category: categoryId,
    brand: brandId,
    image,
    type: type,
    boxContent: boxContent,
    unitId: unitId,
  });
  await product.save();

  const price = Price.build({
    product: product.id,
    sellerPrice,
    purshasePrice: purchasePrice,
  });

  await price.save();

  // Create and save the stock instance
  const stock = Stock.build({
    productId: product.id,
    quantityInStock: 0,
    batch: [],
  });

  await stock.save();

  io.emit("add_product", product);
  res.status(201).send(product);
};

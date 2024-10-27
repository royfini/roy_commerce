import { Request, Response } from "express";
import { Purshase } from "../models/purshase";
import { Supplier } from "../models/supplier";
import { NotFoundError } from "../errors/not-found-error";

const createPurchase = async (req: Request, res: Response) => {
  const newPurshase = new Purshase();

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

  //check if product exist
};

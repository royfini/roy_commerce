import { Request, Response } from "express";
import { NotFoundError } from "../errors/not-found-error";
import { Brand } from "../models/brand";
import { Category } from "../models/category";
import { Product } from "../models/product";
import { io } from "../app";

export const addProduct = async (req: Request, res: Response) => {
    const { name, description, categoryId, brandId, image } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new NotFoundError();
    }
    const brand = await Brand.findById(brandId);
    if(!brand){
        throw new NotFoundError();
    }

    //check if name exist
    const existingProduct = await Product.findOne({ where: { name } })
    if (existingProduct) {
        throw new Error('Product already exist')
    }

    const product = Product.build({
        name,
        description,
        category: categoryId,
        brand: brandId,
        image
    })

    await product.save();

    io.emit('add_product',product);
    res.status(201).send(product);
}
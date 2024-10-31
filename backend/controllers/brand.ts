import { Request, Response } from "express";
import { Brand } from "../models/brand";
import { BadRequestError } from "../errors/bad-request-error";

export const addBrand = async (req: Request, res: Response)=>{
    const {name} = req.body;

    //check if name exist
    const existingBrand = await Brand.findOne({name})
    if(existingBrand){
        throw new BadRequestError('Brand already exist')
    }

    const brand = Brand.build({
        name
    })

    await brand.save()
    res.status(201).send(brand)
}
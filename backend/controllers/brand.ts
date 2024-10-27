import { Request, Response } from "express";
import { Brand } from "../models/brand";

export const addBrand = (req: Request, res: Response)=>{
    const {name} = req.body;

    //check if name exist

    const brand = Brand.build({
        name
    })
    res.status(201).send(brand)
}
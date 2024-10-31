import { Request, Response } from "express";
import { Supplier } from "../models/supplier";

export const addSupplier = async(req: Request,res: Response)=>{
    const {name, phone, address} = req.body;
    
    //check if name exist
    const existingSupplier = await Supplier.findOne({where: {name}})
    if(existingSupplier){
        throw new Error('Supplier already exist')
    }

    const supplier = Supplier.build({
        name,
        phone,
        address
    })
    res.status(201).send(supplier)
}
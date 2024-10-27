import { Request, Response } from "express";
import { Category } from "../models/category";

export const addCategory = async(req: Request,res: Response)=>{
    const {name} = req.body;
    
    //check if name exist

    const category = Category.build({
        name
    })
    res.status(201).send(category)
}
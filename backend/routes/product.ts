import express from 'express'
import { addProduct } from '../controllers/product';
const productRouter = express.Router();

productRouter.post('/add', addProduct)

export {productRouter}
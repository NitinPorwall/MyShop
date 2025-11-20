import express from "express";
import { getProducts, createProduct } from "../controllers/productController.js";

const router = express.Router();

// ✅ Route to get all products
router.get("/", getProducts);

// ✅ Route to create new product
router.post("/", createProduct);

export default router;

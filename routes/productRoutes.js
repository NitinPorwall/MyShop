// routes/productRoutes.js
import express from "express";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new product
router.post("/", async (req, res) => {
  try {
    const { name, description, price, image, sellerName, sellerId } = req.body;

    if (!name || !price || !sellerId) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const product = new Product({
      name,
      description,
      price,
      image: image || "https://picsum.photos/300?random=" + Math.floor(Math.random() * 1000),
      sellerName,
      sellerId: mongoose.Types.ObjectId(sellerId),
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
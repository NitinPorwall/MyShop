// routes/productRoutes.js
import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add new product
router.post("/", async (req, res) => {
  try {
    const { name, description, price, image, sellerId, sellerName } = req.body;

    if (!name || !description || !price || !sellerId || !sellerName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const product = new Product({
      name,
      description,
      price,
      image: image || `https://picsum.photos/300?random=${Math.floor(Math.random() * 1000)}`,
      sellerId,
      sellerName,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
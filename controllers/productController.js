import Product from "../models/Product.js";
import mongoose from "mongoose";

// ================== GET ALL PRODUCTS ==================
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ message: "Server error fetching products" });
  }
};

// ================== CREATE NEW PRODUCT ==================
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, sellerId, sellerName, image } = req.body;

    // Validation
    if (!name || !description || !price || !sellerId || !sellerName) {
      return res.status(400).json({ message: "All product fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const product = new Product({
      name,
      description,
      price,
      sellerId,
      sellerName,
      image: image || `https://picsum.photos/300?random=${Math.floor(Math.random() * 1000)}`,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(400).json({ message: err.message });
  }
};
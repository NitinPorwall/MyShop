const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Create new product
router.post("/", async (req, res) => {
  try {
    const { name, description, price, image, sellerName, sellerId } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const product = new Product({
      name,
      description,
      price,
      image: image || "https://picsum.photos/300?random=" + Math.floor(Math.random()*1000),
      sellerName,
      sellerId,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
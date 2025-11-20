import Product from "../models/Product.js";

// ✅ Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, sellerId, sellerName } = req.body;

    const product = new Product({
      name,
      description,
      price,
      sellerId,
      sellerName,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

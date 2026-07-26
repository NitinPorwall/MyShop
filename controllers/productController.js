const Product = require('../models/Product');

// GET /api/products?category=&search=&sort=&minPrice=&maxPrice=
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let query = Product.find(filter).populate('seller', 'name');
    if (sort === 'low') query = query.sort({ price: 1 });
    else if (sort === 'high') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query;
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
};

// GET /api/products/seller/mine - seller's own catalogue
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your products', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, color } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ message: 'Name, price and category are required' });
    }
    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      color,
      seller: req.user.id,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own products' });
    }
    const { name, description, price, category, stock, color } = req.body;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (color !== undefined) product.color = color;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

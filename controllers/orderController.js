const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/orders  body: { items: [{ productId, qty }] }
// Prices are always re-read from the database, never trusted from the client.
exports.placeOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const { productId, qty } of items) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: `Product ${productId} not found` });
      if (product.stock < qty) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }
      product.stock -= qty;
      await product.save();

      orderItems.push({ product: product._id, name: product.name, price: product.price, qty });
      totalAmount += product.price * qty;
    }

    const order = await Order.create({ buyer: req.user.id, items: orderItems, totalAmount });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order', error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

// GET /api/orders/seller - orders containing at least one of this seller's products
exports.getSellerOrders = async (req, res) => {
  try {
    const myProducts = await Product.find({ seller: req.user.id }).select('_id');
    const productIds = myProducts.map((p) => p._id);
    const orders = await Order.find({ 'items.product': { $in: productIds } }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

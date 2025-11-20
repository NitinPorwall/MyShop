import Order from "../models/Order.js";

// ✅ Create new order (checkout)
export const createOrder = async (req, res) => {
  try {
    const { customerId, customerName, items, totalAmount } = req.body;

    const newOrder = new Order({
      customerId,
      customerName,
      items,
      totalAmount,
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "Error placing order" });
  }
};

// ✅ Get all orders (for a customer)
export const getOrdersByCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({ customerId: id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

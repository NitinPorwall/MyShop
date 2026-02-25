import Order from "../models/Order.js";
import mongoose from "mongoose";

// ================== CREATE NEW ORDER ==================
export const createOrder = async (req, res) => {
  try {
    const { customerId, customerName, items, totalAmount } = req.body;

    // Validation
    if (!customerId || !customerName || !items || !totalAmount) {
      return res.status(400).json({ message: "All order fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const newOrder = new Order({
      customerId,
      customerName,
      items,
      totalAmount,
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Create Order error:", error);
    res.status(500).json({ message: "Error placing order" });
  }
};

// ================== GET ORDERS BY CUSTOMER ==================
export const getOrdersByCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get Orders error:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};
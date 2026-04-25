import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

// ================== VALIDATION HELPERS ==================
const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: "Order must contain at least one item" };
  }

  for (const item of items) {
    if (!item.productId || !item.name || !item.quantity || !item.price) {
      return { valid: false, message: "Each item must have productId, name, quantity, and price" };
    }
    if (item.quantity < 1) {
      return { valid: false, message: "Quantity must be at least 1" };
    }
    if (item.price < 0) {
      return { valid: false, message: "Price cannot be negative" };
    }
  }
  return { valid: true };
};

const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => total + (item.quantity * item.price), 0);
};

// ================== CREATE NEW ORDER ==================
export const createOrder = async (req, res) => {
  try {
    // Get customer ID from authenticated user (middleware should set req.user)
    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required to place an order" 
      });
    }

    const { 
      customerName, 
      customerEmail, 
      items, 
      shippingAddress, 
      paymentMethod,
      notes 
    } = req.body;

    // Validate required fields
    if (!customerName || !items || !shippingAddress) {
      return res.status(400).json({ 
        success: false,
        message: "Customer name, items, and shipping address are required" 
      });
    }

    // Validate items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.valid) {
      return res.status(400).json({ 
        success: false,
        message: itemsValidation.message 
      });
    }

    // Calculate and verify total amount
    const calculatedTotal = calculateOrderTotal(items);
    
    // Verify product availability and get current prices
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ 
          success: false,
          message: `Invalid product ID: ${item.productId}` 
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: `Product not found: ${item.name}` 
        });
      }

      if (!product.inStock || product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: `Insufficient stock for product: ${product.name}` 
        });
      }
    }

    // Create order
    const newOrder = new Order({
      customerId,
      customerName,
      customerEmail: customerEmail || req.user.email,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price
      })),
      totalAmount: calculatedTotal,
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || 'India'
      },
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: notes || ''
    });

    await newOrder.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({ 
      success: true,
      message: "Order placed successfully", 
      order: newOrder 
    });
  } catch (error) {
    console.error("Create Order error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error placing order" 
    });
  }
};

// ================== GET ORDERS BY CUSTOMER ==================
export const getOrdersByCustomer = async (req, res) => {
  try {
    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customerId });

    res.json({ 
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get Orders error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching orders" 
    });
  }
};

// ================== GET ORDER BY ID ==================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Check if user is the customer or admin
    if (order.customerId.toString() !== customerId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this order" 
      });
    }

    res.json({ 
      success: true,
      order 
    });
  } catch (error) {
    console.error("Get Order by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching order" 
    });
  }
};

// ================== CANCEL ORDER ==================
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Check ownership
    if (order.customerId.toString() !== customerId) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to cancel this order" 
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ 
        success: false,
        message: "Order cannot be cancelled at this stage" 
      });
    }

    // Update order status
    order.orderStatus = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }

    res.json({ 
      success: true,
      message: "Order cancelled successfully",
      order 
    });
  } catch (error) {
    console.error("Cancel Order error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error cancelling order" 
    });
  }
};

// ================== ADMIN: GET ALL ORDERS ==================
export const getAllOrders = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Admin access required" 
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter options
    const filter = {};
    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const orders = await Order.find(filter)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({ 
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get All Orders error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching orders" 
    });
  }
};

// ================== ADMIN: UPDATE ORDER STATUS ==================
export const updateOrderStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Admin access required" 
      });
    }

    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid order ID" 
      });
    }

    const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    const updateData = {};
    
    if (orderStatus) {
      if (!validOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({ 
          success: false,
          message: `Invalid order status. Allowed: ${validOrderStatuses.join(', ')}` 
        });
      }
      updateData.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ 
          success: false,
          message: `Invalid payment status. Allowed: ${validPaymentStatuses.join(', ')}` 
        });
      }
      updateData.paymentStatus = paymentStatus;
    }

    const order = await Order.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Order updated successfully",
      order 
    });
  } catch (error) {
    console.error("Update Order Status error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating order" 
    });
  }
};
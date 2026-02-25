// routes/orderRoutes.js
import express from "express";
import { createOrder, getOrdersByCustomer } from "../controllers/orderController.js";

const router = express.Router();

// POST /api/orders  -> create a new order
router.post("/", createOrder);

// GET /api/orders/:id -> get all orders by a customer
router.get("/:id", getOrdersByCustomer);

export default router;
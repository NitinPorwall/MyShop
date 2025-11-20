import express from "express";
import { createOrder, getOrdersByCustomer } from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/:id", getOrdersByCustomer);

export default router;

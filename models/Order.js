import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerName: String,
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
      sellerName: String,
    },
  ],
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);

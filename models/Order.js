import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        sellerName: { type: String, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

export default mongoose.model("Order", orderSchema);
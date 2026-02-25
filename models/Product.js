// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: {
    type: String,
    required: true,
    default: () => `https://picsum.photos/300?random=${Math.floor(Math.random() * 1000)}`,
  },
  sellerName: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Product = mongoose.model("Product", productSchema);
export default Product;
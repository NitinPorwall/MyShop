const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" }, // NEW: image field
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sellerName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
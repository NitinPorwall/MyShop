import mongoose from "mongoose";
import Product from "./models/Product.js";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const products = [];

for (let i = 1; i <= 50; i++) {
  products.push({
    name: `Seller1 Product ${i}`,
    description: `High quality product ${i}`,
    price: 500 + i * 10,
    sellerName: "Seller1",
    sellerId: "699ec8b540023a3071d2d219",
    image: `https://picsum.photos/300?random=${i}`
  });
}

for (let i = 51; i <= 100; i++) {
  products.push({
    name: `Seller2 Product ${i - 50}`,
    description: `High quality product ${i}`,
    price: 700 + i * 10,
    sellerName: "Seller2",
    sellerId: "699ec8be40023a3071d2d21c",
    image: `https://picsum.photos/300?random=${i}`
  });
}

await Product.insertMany(products);

console.log("✅ 100 Products Inserted Successfully");
process.exit();
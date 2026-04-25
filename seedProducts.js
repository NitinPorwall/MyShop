import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

await Product.deleteMany();

await Product.insertMany([
  {
    name: "Shoes",
    price: 2000,
    image: "/images/catalogue.jpg",
  },
  {
    name: "Watch",
    price: 1500,
    image: "/images/catalogue.jpg",
  },
]);

console.log("Products Seeded");
process.exit();
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const products = [
  {
    name: "Sample Product 1",
    description: "This is a sample product",
    price: 299,
    image: "https://picsum.photos/300?random=1", // hosted image
    sellerName: "Seller2",
    sellerId: "699ec8be40023a3071d2d21c", // real seller _id
  },
  {
    name: "Sample Product 2",
    description: "Another product",
    price: 499,
    image: "https://picsum.photos/300?random=2",
    sellerName: "Seller2",
    sellerId: "699ec8be40023a3071d2d21c",
  },
];

const seedProducts = async () => {
  try {
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log("Products seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedProducts();
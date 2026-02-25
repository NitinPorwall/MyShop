import mongoose from "mongoose";
import Product from "./models/Product.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Use the real seller ObjectId
const sellerId = "699ec8be40023a3071d2d21c";

const products = [
  {
    name: "Classic Blue Pen",
    description: "Smooth ink and ergonomic grip",
    price: 15,
    image: "https://picsum.photos/300?random=101",
    sellerId,
    sellerName: "Seller2"
  },
  {
    name: "Notebook",
    description: "200 pages ruled notebook",
    price: 50,
    image: "https://picsum.photos/300?random=102",
    sellerId,
    sellerName: "Seller2"
  },
  {
    name: "Marker Pen",
    description: "Permanent ink marker",
    price: 30,
    image: "https://picsum.photos/300?random=103",
    sellerId,
    sellerName: "Seller2"
  }
];

const seedProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany();

    // Insert new products
    await Product.insertMany(products);

    console.log("Products seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedProducts();
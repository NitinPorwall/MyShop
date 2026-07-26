// Populates the database with a demo seller account and a handful of
// products so the app has something to show right after setup.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');

const run = async () => {
  await connectDB();

  await Product.deleteMany({});
  await User.deleteMany({ email: 'seller@myshop.test' });

  const hashedPassword = await bcrypt.hash('password123', 10);
  const seller = await User.create({
    name: 'Demo Seller',
    email: 'seller@myshop.test',
    password: hashedPassword,
    role: 'seller',
  });

  await Product.insertMany([
    // Electronics
    { name: 'Wireless Noise-Cancelling Headphones', description: 'Over-ear headphones with 30-hour battery life and adaptive noise cancellation.', price: 5499, category: 'Electronics', stock: 25, color: '#3B4A5A', seller: seller._id },
    { name: 'Smart Fitness Band', description: 'Tracks heart rate, sleep, and steps. 10-day battery life.', price: 2199, category: 'Electronics', stock: 40, color: '#4B5842', seller: seller._id },
    { name: 'Portable Bluetooth Speaker', description: 'Waterproof speaker with 12-hour playback and deep bass.', price: 1899, category: 'Electronics', stock: 30, color: '#B5652D', seller: seller._id },

    // Fashion
    { name: 'Ribbed Merino Sweater', description: 'Fine-gauge merino wool sweater for everyday layering.', price: 2299, category: 'Fashion', stock: 20, color: '#E4DCC8', seller: seller._id },
    { name: 'Straight Fit Denim Jeans', description: '13oz rigid denim, straight through the leg.', price: 2799, category: 'Fashion', stock: 18, color: '#3B4A5A', seller: seller._id },

    // Home & Kitchen
    { name: 'Stainless Steel Cookware Set', description: '5-piece induction-safe cookware set with lids.', price: 4999, category: 'Home & Kitchen', stock: 14, color: '#6B6659', seller: seller._id },
    { name: 'Ceramic Pour-Over Coffee Set', description: 'Hand-poured ceramic dripper with matching carafe.', price: 1599, category: 'Home & Kitchen', stock: 22, color: '#CFC3A3', seller: seller._id },

    // Beauty & Personal Care
    { name: 'Vitamin C Face Serum', description: 'Brightening serum with 10% vitamin C, 30ml.', price: 899, category: 'Beauty & Personal Care', stock: 45, color: '#B5652D', seller: seller._id },

    // Books
    { name: 'The Pragmatic Programmer', description: 'A classic guide to becoming a more effective, adaptable software developer.', price: 799, category: 'Books', stock: 35, color: '#4B5842', seller: seller._id },

    // Sports & Fitness
    { name: 'Adjustable Dumbbell Set', description: 'Space-saving pair, adjustable from 2.5kg to 24kg each.', price: 6999, category: 'Sports & Fitness', stock: 10, color: '#3B4A5A', seller: seller._id },
    { name: 'Yoga Mat with Carry Strap', description: '6mm non-slip mat, includes a carry strap.', price: 1099, category: 'Sports & Fitness', stock: 28, color: '#E4DCC8', seller: seller._id },

    // Groceries
    { name: 'Single-Origin Coffee Beans, 500g', description: 'Medium roast arabica beans, freshly ground on order.', price: 599, category: 'Groceries', stock: 50, color: '#B5652D', seller: seller._id },
  ]);

  console.log('Seed complete.');
  console.log('Login as seller@myshop.test / password123 to manage this catalogue.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});

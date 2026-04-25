import Product from "../models/Product.js";
import mongoose from "mongoose";

// ================== VALIDATION HELPERS ==================
const validateImageUrl = (url) => {
  if (!url) return true; // Allow empty (will use default)
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

// ================== GET ALL PRODUCTS ==================
export const getProducts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // In stock filter
    if (req.query.inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // Seller filter
    if (req.query.sellerId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.sellerId)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid seller ID" 
        });
      }
      filter.sellerId = req.query.sellerId;
    }

    // Sort options
    const sortOptions = {};
    if (req.query.sort === 'price-low') sortOptions.price = 1;
    else if (req.query.sort === 'price-high') sortOptions.price = -1;
    else if (req.query.sort === 'newest') sortOptions.createdAt = -1;
    else if (req.query.sort === 'rating') sortOptions.rating = -1;
    else sortOptions.createdAt = -1; // Default sort

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({ 
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching products" 
    });
  }
};

// ================== GET SINGLE PRODUCT ==================
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid product ID" 
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    res.json({ 
      success: true,
      product 
    });
  } catch (err) {
    console.error("Get Product Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching product" 
    });
  }
};

// ================== CREATE NEW PRODUCT ==================
export const createProduct = async (req, res) => {
  try {
    // Check authentication and authorization
    const sellerId = req.user?.id;
    const userRole = req.user?.role;

    if (!sellerId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required to create products" 
      });
    }

    if (userRole !== 'seller' && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Only sellers or admins can create products" 
      });
    }

    const { 
      name, 
      description, 
      price, 
      category, 
      stock, 
      image, 
      brand,
      discount 
    } = req.body;

    // Validate required fields
    if (!name || !description || !price) {
      return res.status(400).json({ 
        success: false,
        message: "Name, description, and price are required" 
      });
    }

    // Validate price
    if (price < 0) {
      return res.status(400).json({ 
        success: false,
        message: "Price cannot be negative" 
      });
    }

    // Validate stock
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ 
        success: false,
        message: "Stock cannot be negative" 
      });
    }

    // Validate image URL
    if (image && !validateImageUrl(image)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid image URL format" 
      });
    }

    // Validate discount
    if (discount !== undefined && (discount < 0 || discount > 100)) {
      return res.status(400).json({ 
        success: false,
        message: "Discount must be between 0 and 100" 
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedDescription = sanitizeString(description);
    const sanitizedBrand = brand ? sanitizeString(brand) : undefined;

    // Calculate discounted price
    const discountPrice = discount ? price - (price * discount / 100) : price;

    const product = new Product({
      name: sanitizedName,
      description: sanitizedDescription,
      price,
      originalPrice: price,
      category: category || 'uncategorized',
      stock: stock || 0,
      inStock: (stock || 0) > 0,
      image: image || `https://picsum.photos/300?random=${Math.floor(Math.random() * 1000)}`,
      brand: sanitizedBrand,
      discount: discount || 0,
      discountPrice,
      sellerId,
      sellerName: req.user.name || 'Unknown Seller',
      rating: 0,
      reviewCount: 0
    });

    await product.save();

    res.status(201).json({ 
      success: true,
      message: "Product created successfully", 
      product 
    });
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(400).json({ 
      success: false,
      message: err.message || "Error creating product" 
    });
  }
};

// ================== UPDATE PRODUCT ==================
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?.id;
    const userRole = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid product ID" 
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    // Check authorization
    if (product.sellerId.toString() !== sellerId && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this product" 
      });
    }

    const { 
      name, 
      description, 
      price, 
      category, 
      stock, 
      image, 
      brand,
      discount 
    } = req.body;

    // Validate price
    if (price !== undefined && price < 0) {
      return res.status(400).json({ 
        success: false,
        message: "Price cannot be negative" 
      });
    }

    // Validate stock
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ 
        success: false,
        message: "Stock cannot be negative" 
      });
    }

    // Validate image URL
    if (image && !validateImageUrl(image)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid image URL format" 
      });
    }

    // Validate discount
    if (discount !== undefined && (discount < 0 || discount > 100)) {
      return res.status(400).json({ 
        success: false,
        message: "Discount must be between 0 and 100" 
      });
    }

    // Update fields
    if (name) product.name = sanitizeString(name);
    if (description) product.description = sanitizeString(description);
    if (price !== undefined) {
      product.price = price;
      product.originalPrice = price;
    }
    if (category) product.category = category;
    if (stock !== undefined) {
      product.stock = stock;
      product.inStock = stock > 0;
    }
    if (image) product.image = image;
    if (brand) product.brand = sanitizeString(brand);
    if (discount !== undefined) {
      product.discount = discount;
      product.discountPrice = price ? price - (price * discount / 100) : product.price;
    }

    await product.save();

    res.json({ 
      success: true,
      message: "Product updated successfully", 
      product 
    });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(400).json({ 
      success: false,
      message: err.message || "Error updating product" 
    });
  }
};

// ================== DELETE PRODUCT ==================
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?.id;
    const userRole = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid product ID" 
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    // Check authorization
    if (product.sellerId.toString() !== sellerId && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this product" 
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: "Product deleted successfully" 
    });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error deleting product" 
    });
  }
};

// ================== GET CATEGORIES ==================
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.json({ 
      success: true,
      categories 
    });
  } catch (err) {
    console.error("Get Categories Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching categories" 
    });
  }
};

// ================== GET SELLER PRODUCTS ==================
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find({ sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ sellerId });

    res.json({ 
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get Seller Products Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching seller products" 
    });
  }
};
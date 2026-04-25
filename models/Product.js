// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    
    // Pricing
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
    },
    
    // Categorization
    category: {
      type: String,
      default: "uncategorized",
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    
    // Inventory
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    inStock: {
      type: Boolean,
      default: false,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    
    // Images
    image: {
      type: String,
      default: "https://picsum.photos/300",
    },
    images: [{
      type: String,
    }],
    
    // Seller Information
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
    },
    sellerName: {
      type: String,
      required: [true, "Seller name is required"],
      trim: true,
    },
    
    // Ratings & Reviews
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, "Review count cannot be negative"],
    },
    
    // Product Features
    features: [{
      type: String,
      trim: true,
    }],
    specifications: [{
      key: {
        type: String,
        trim: true,
      },
      value: {
        type: String,
        trim: true,
      },
    }],
    
    // Product Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    
    // SEO
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    metaTitle: {
      type: String,
      maxlength: [60, "Meta title cannot exceed 60 characters"],
    },
    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },
    
    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

// ================== INDEXES ==================
// Text index for search functionality
productSchema.index(
  { name: "text", description: "text", brand: "text", tags: "text" },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 } }
);

// Query optimization indexes
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ inStock: 1, isActive: 1 });

// ================== VIRTUALS ==================
// Calculate discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return this.discount;
});

// Check if low stock
productSchema.virtual("isLowStock").get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Ensure virtuals are included in JSON output
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// ================== PRE-SAVE MIDDLEWARE ==================
productSchema.pre("save", function (next) {
  // Set inStock based on stock
  if (this.stock !== undefined) {
    this.inStock = this.stock > 0;
  }

  // Calculate discount price if discount is set
  if (this.discount && this.discount > 0 && this.price) {
    this.discountPrice = this.price - (this.price * this.discount / 100);
  }

  // Set original price if not set
  if (!this.originalPrice) {
    this.originalPrice = this.price;
  }

  // Generate slug from name if not provided
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  next();
});

// ================== STATIC METHODS ==================
// Find products by category
productSchema.statics.findByCategory = function (category, options = {}) {
  const query = { category, isActive: true };
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Find products by seller
productSchema.statics.findBySeller = function (sellerId, options = {}) {
  return this.find({ sellerId })
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

// Search products
productSchema.statics.search = function (searchText, options = {}) {
  return this.find(
    { $text: { $search: searchText }, isActive: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Get featured products
productSchema.statics.getFeatured = function (limit = 10) {
  return this.find({ isFeatured: true, isActive: true, inStock: true })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit);
};

// ================== INSTANCE METHODS ==================
// Update stock
productSchema.methods.updateStock = async function (quantity) {
  this.stock -= quantity;
  if (this.stock < 0) this.stock = 0;
  this.inStock = this.stock > 0;
  return this.save();
};

// Add rating
productSchema.methods.addRating = async function (newRating) {
  // Calculate new average rating
  const totalRating = (this.rating * this.reviewCount) + newRating;
  this.reviewCount += 1;
  this.rating = Math.round((totalRating / this.reviewCount) * 10) / 10;
  return this.save();
};

// Increment view count
productSchema.methods.incrementView = async function () {
  this.viewCount += 1;
  return this.save();
};

// Increment sold count
productSchema.methods.incrementSold = async function (quantity = 1) {
  this.soldCount += quantity;
  return this.updateStock(quantity);
};

const Product = mongoose.model("Product", productSchema);
export default Product;
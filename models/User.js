// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },
    
    // Contact Information
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    
    // Role & Permissions
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    
    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    // Password Management
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    
    // Login Tracking
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    
    // Two-Factor Authentication
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    
    // Addresses
    addresses: [
      {
        label: {
          type: String,
          trim: true,
        },
        street: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        state: {
          type: String,
          trim: true,
        },
        zipCode: {
          type: String,
          trim: true,
        },
        country: {
          type: String,
          default: "India",
          trim: true,
        },
        phone: {
          type: String,
          trim: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    
    // Social Login (OAuth)
    socialLogin: {
      provider: {
        type: String,
        enum: ["google", "facebook", "apple", null],
        default: null,
      },
      providerId: {
        type: String,
        default: null,
      },
    },
    
    // Profile Completion
    profileCompletion: {
      type: Number,
      default: 20, // Starts at 20% (name + email)
      min: 0,
      max: 100,
    },
    
    // Preferences
    preferences: {
      newsletter: {
        type: Boolean,
        default: false,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: "en",
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    
    // Wishlist (product references)
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }],
    
    // Refresh Tokens
    refreshTokens: [{
      token: String,
      expires: Date,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ================== INDEXES ==================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ "socialLogin.provider": 1, "socialLogin.providerId": 1 });
userSchema.index({ createdAt: -1 });

// ================== VIRTUALS ==================
// Check if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Get full profile completion status
userSchema.virtual("isProfileComplete").get(function () {
  return this.profileCompletion >= 100;
});

// Get default address
userSchema.virtual("defaultAddress").get(function () {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Ensure virtuals are included in JSON output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// ================== PRE-SAVE MIDDLEWARE ==================
// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Set password changed timestamp
  this.passwordChangedAt = Date.now() - 1000;
  
  next();
});

// Update profile completion percentage
userSchema.pre("save", function (next) {
  let completion = 20; // Base: name + email
  
  if (this.phone) completion += 15;
  if (this.addresses && this.addresses.length > 0) completion += 20;
  if (this.profilePicture) completion += 15;
  if (this.isEmailVerified) completion += 15;
  if (this.preferences?.newsletter) completion += 15;
  
  this.profileCompletion = Math.min(completion, 100);
  next();
});

// ================== INSTANCE METHODS ==================
// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Handle login attempts
userSchema.methods.handleLoginAttempt = async function () {
  // Reset if lock has expired
  if (this.isLocked && this.lockUntil < Date.now()) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save();
    return { locked: false, attempts: 0 };
  }

  // Increment attempts
  this.loginAttempts += 1;

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }

  await this.save();
  return { 
    locked: this.isLocked, 
    attempts: this.loginAttempts,
    lockUntil: this.lockUntil
  };
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save();
};

// Add address
userSchema.methods.addAddress = async function (address) {
  // If this is the first address or marked as default, unset other defaults
  if (address.isDefault || this.addresses.length === 0) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  
  this.addresses.push(address);
  await this.save();
  return this.addresses[this.addresses.length - 1];
};

// Update address
userSchema.methods.updateAddress = async function (addressId, updates) {
  const address = this.addresses.id(addressId);
  if (!address) throw new Error("Address not found");
  
  Object.assign(address, updates);
  await this.save();
  return address;
};

// Delete address
userSchema.methods.deleteAddress = async function (addressId) {
  const address = this.addresses.id(addressId);
  if (!address) throw new Error("Address not found");
  
  const wasDefault = address.isDefault;
  address.deleteOne();
  
  // Set new default if deleted was default
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }
  
  await this.save();
  return true;
};

// Add to wishlist
userSchema.methods.addToWishlist = async function (productId) {
  if (!this.wishlist.includes(productId)) {
    this.wishlist.push(productId);
    await this.save();
  }
  return this.wishlist;
};

// Remove from wishlist
userSchema.methods.removeFromWishlist = async function (productId) {
  this.wishlist = this.wishlist.filter(id => id.toString() !== productId.toString());
  await this.save();
  return this.wishlist;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  // Hash token and save to database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
    
  // Set expiration (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Add refresh token
userSchema.methods.addRefreshToken = function (token, expires) {
  this.refreshTokens.push({ token, expires });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return this.refreshTokens;
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.refreshTokens;
};

// ================== STATIC METHODS ==================
// Find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Find users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Check if email exists
userSchema.statics.emailExists = async function (email) {
  const user = await this.findOne({ email: email.toLowerCase() }).select("_id");
  return !!user;
};

// Get user statistics
userSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);
  return stats;
};

const User = mongoose.model("User", userSchema);
export default User;
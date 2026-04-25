import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Customer Information
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Order Items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
        sellerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        sellerName: {
          type: String,
          trim: true,
        },
      },
    ],

    // Pricing
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Shipping Address
    shippingAddress: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
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
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "upi", "netbanking", "wallet"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partial_refund"],
      default: "pending",
    },
    paymentId: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
    },

    // Order Status
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],

    // Delivery Information
    deliveryDate: {
      type: Date,
    },
    deliveredDate: {
      type: Date,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    carrier: {
      type: String,
      trim: true,
    },

    // Additional Information
    notes: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ["user", "admin", "system"],
    },
    cancellationDate: {
      type: Date,
    },

    // Admin Notes (internal)
    adminNotes: {
      type: String,
      trim: true,
    },

    // Coupon/ Promo Code
    couponCode: {
      type: String,
      trim: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

// Index for better query performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order number
orderSchema.virtual("orderNumber").get(function () {
  return `ORD-${this._id.toString().slice(-8).toUpperCase}`;
});

// Ensure virtuals are included in JSON output
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

// Pre-save middleware to add status history
orderSchema.pre("save", function (next) {
  if (this.isModified("orderStatus") && !this.statusHistory.some(s => s.status === this.orderStatus)) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: `Order status updated to ${this.orderStatus}`,
    });
  }
  next();
});

export default mongoose.model("Order", orderSchema);
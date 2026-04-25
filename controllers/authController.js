import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ================== VALIDATION HELPERS ==================
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number and one special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

// ================== REGISTER USER ==================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 8 characters, with uppercase, lowercase, number and special character" 
      });
    }

    // Validate role
    const allowedRoles = ['user', 'admin', 'seller'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid role. Allowed roles: user, admin, seller" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role 
    });

    // Generate token
    const token = generateToken(user);

    // Exclude password in response
    const userResponse = { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    };

    res.status(201).json({ 
      success: true,
      message: "User registered successfully", 
      token,
      user: userResponse 
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during registration" 
    });
  }
};

// ================== LOGIN USER ==================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact support." 
      });
    }

    // Generate token
    const token = generateToken(user);

    // Exclude password in response
    const userResponse = { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    };

    res.json({ 
      success: true,
      message: "Login successful", 
      token,
      user: userResponse 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
};

// ================== GET CURRENT USER ==================
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// ================== UPDATE PASSWORD ==================
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Current password and new password are required" 
      });
    }

    // Validate new password strength
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        success: false,
        message: "New password must be at least 8 characters, with uppercase, lowercase, number and special character" 
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ 
      success: true,
      message: "Password updated successfully" 
    });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// ================== HELPER FUNCTION ==================
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables!");
  }

  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
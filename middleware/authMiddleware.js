const jwt = require('jsonwebtoken');

// Verifies the JWT sent in the Authorization header and attaches the
// decoded payload ({ id, role }) to req.user for downstream handlers.
const protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Restricts a route to one or more roles, e.g. requireRole('seller')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access restricted to: ${roles.join(', ')}` });
  }
  next();
};

module.exports = { protect, requireRole };

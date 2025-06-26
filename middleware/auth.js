const JWTUtils = require('../utils/jwt');
const User = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Extract token from Bearer format
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    // Verify token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Authorization middleware for role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    const decoded = JWTUtils.verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Admin only middleware
const adminOnly = [authenticate, authorize('admin')];

// User only middleware
const userOnly = [authenticate, authorize('user')];

// User or Admin middleware
const authenticated = [authenticate, authorize('user', 'admin')];

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  adminOnly,
  userOnly,
  authenticated
}; 
const JWTUtils = require('../utils/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    const decoded = JWTUtils.verifyAccessToken(token);
    
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
    next();
  }
};

const adminOnly = [authenticate, authorize('admin')];

const userOnly = [authenticate, authorize('user')];

const authenticated = [authenticate, authorize('user', 'admin')];

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  adminOnly,
  userOnly,
  authenticated
}; 

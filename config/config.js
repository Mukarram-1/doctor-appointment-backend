require('dotenv').config();

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGODB_URI:
    process.env.MONGODB_URI,

  JWT: {
    ACCESS_SECRET:
      process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE,
    REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE,
  },

  RATE_LIMIT: {
    WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
    MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 5,
  },

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

module.exports = config; 

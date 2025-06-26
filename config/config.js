require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGODB_URI:
    process.env.MONGODB_URI,

  // JWT Configuration
  JWT: {
    ACCESS_SECRET:
      process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE,
    REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE,
  },

  // Email Configuration
  EMAIL: {
    HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
    PORT: process.env.EMAIL_PORT || 587,
    USER: process.env.EMAIL_USER || "",
    PASS: process.env.EMAIL_PASS || "",
    FROM:
      process.env.EMAIL_FROM ||
      "Doctor Appointment System <noreply@doctorapp.com>",
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
    MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 5,
  },

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

module.exports = config; 
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class JWTUtils {
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.JWT.ACCESS_SECRET, {
      expiresIn: config.JWT.ACCESS_EXPIRE,
      issuer: 'doctor-appointment-api',
      audience: 'doctor-appointment-client'
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT.REFRESH_SECRET, {
      expiresIn: config.JWT.REFRESH_EXPIRE,
      issuer: 'doctor-appointment-api',
      audience: 'doctor-appointment-client'
    });
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.JWT.ACCESS_SECRET, {
        issuer: 'doctor-appointment-api',
        audience: 'doctor-appointment-client'
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.JWT.REFRESH_SECRET, {
        issuer: 'doctor-appointment-api',
        audience: 'doctor-appointment-client'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: config.JWT.ACCESS_EXPIRE
    };
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }

  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    return expiration ? expiration < new Date() : true;
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }
}

module.exports = JWTUtils; 

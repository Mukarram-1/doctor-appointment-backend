const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const emailService = require('./emailService');

class AuthService {
  // Register a new user
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };
      
      const tokens = JWTUtils.generateTokenPair(tokenPayload);
      
      // Save refresh token to user
      await user.addRefreshToken(tokens.refreshToken);

      // Send welcome email (don't wait for it)
      emailService.sendWelcomeEmail(user).catch(error => {
        console.error('Failed to send welcome email:', error);
      });

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Find user with password field included
      const user = await User.findByEmail(email).select('+password');
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Check password
      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };
      
      const tokens = JWTUtils.generateTokenPair(tokenPayload);
      
      // Save refresh token to user
      await user.addRefreshToken(tokens.refreshToken);

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('Invalid refresh token');
      }

      const tokenExists = user.refreshTokens.some(
        tokenObj => tokenObj.token === refreshToken
      );
      
      if (!tokenExists) {
        throw new Error('Invalid refresh token');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };
      
      const tokens = JWTUtils.generateTokenPair(tokenPayload);
      
      // Replace old refresh token with new one
      await user.removeRefreshToken(refreshToken);
      await user.addRefreshToken(tokens.refreshToken);

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  // Logout user (remove refresh token)
  async logout(userId, refreshToken) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.removeRefreshToken(refreshToken);
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Logout from all devices
  async logoutAll(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.removeAllRefreshTokens();
      
      return { message: 'Logged out from all devices successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      // Remove sensitive fields from update data
      const { password, role, refreshTokens, ...allowedUpdates } = updateData;
      
      const user = await User.findByIdAndUpdate(
        userId,
        allowedUpdates,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.matchPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Remove all refresh tokens to force re-login
      await user.removeAllRefreshTokens();

      return { message: 'Password changed successfully. Please login again.' };
    } catch (error) {
      throw error;
    }
  }

  // Verify token validity
  async verifyToken(token) {
    try {
      const decoded = JWTUtils.verifyAccessToken(token);
      
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      return {
        valid: true,
        user: user.toJSON()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new AuthService(); 
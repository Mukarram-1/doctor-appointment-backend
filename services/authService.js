const User = require('../models/User');
const JWTUtils = require('../utils/jwt');

class AuthService {
  async register(userData) {
    try {
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = new User(userData);
      await user.save();

      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };
      
      const tokens = JWTUtils.generateTokenPair(tokenPayload);
      
      await user.addRefreshToken(tokens.refreshToken);

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      const user = await User.findByEmail(email).select('+password');
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      user.lastLogin = new Date();
      await user.save();

      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };
      
      const tokens = JWTUtils.generateTokenPair(tokenPayload);
      
      await user.addRefreshToken(tokens.refreshToken);

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
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

      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };
      
      const tokens = JWTUtils.generateTokenPair(tokenPayload);
      
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

  async updateProfile(userId, updateData) {
    try {
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

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await user.matchPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      await user.removeAllRefreshTokens();

      return { message: 'Password changed successfully. Please login again.' };
    } catch (error) {
      throw error;
    }
  }

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

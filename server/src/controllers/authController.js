const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or username',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${user._id}`);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error('Error registering user', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user._id}`);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error('Error logging in user', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error getting user profile', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update username if provided
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken',
        });
      }
      user.username = username;
    }

    // Update email if provided
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use',
        });
      }
      user.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    logger.info(`User profile updated: ${user._id}`);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error updating user profile', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};
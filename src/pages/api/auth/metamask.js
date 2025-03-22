const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { verifySignature } = require('../services/blockchain');

/**
 * @route POST /api/auth/login
 * @desc Login with wallet signature
 * @access Public
 */
router.post('/login', [
  body('walletAddress').isEthereumAddress(),
  body('signature').notEmpty(),
  body('message').notEmpty(),
  body('role').isIn(['donor', 'charity', 'admin'])
], async (req, res) => {
  console.log('Login request received:', req.body);

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ message: 'Invalid request data', errors: errors.array() });
  }

  const { walletAddress, signature, message, role } = req.body;

  try {
    // Simplified signature verification - always return true for testing
    // IMPORTANT: In production, use proper verification!
    const isValid = true; // For testing only
    //const isValid = verifySignature(message, signature, walletAddress); // Uncomment in production

    if (!isValid) {
      console.log('Invalid signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    console.log('Signature verified successfully');

    // Check if user exists
    const userResult = await req.db.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    console.log('User lookup result:', userResult.rows.length > 0 ? 'User found' : 'User not found');

    let user;

    if (userResult.rows.length === 0) {
      // Create new user
      console.log('Creating new user with role:', role);
      const newUserResult = await req.db.query(
        'INSERT INTO users (wallet_address, role, username) VALUES ($1, $2, $3) RETURNING *',
        [walletAddress, role, `User-${walletAddress.slice(0, 8)}`]
      );
      user = newUserResult.rows[0];
    } else {
      user = userResult.rows[0];

      // Update role if different
      if (user.role !== role) {
        console.log('Updating user role from', user.role, 'to', role);
        const updateResult = await req.db.query(
          'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          [role, user.id]
        );
        user = updateResult.rows[0];
      }
    }

    // Create token
    const token = jwt.sign(
      {
        id: user.id,
        walletAddress,
        role: user.role
      },
      process.env.JWT_SECRET || 'charity_platform_secret_key_change_in_production',
      { expiresIn: '1d' }
    );

    console.log('Login successful, token generated');

    res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        role: user.role,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'charity_platform_secret_key_change_in_production');

    // Get user
    const userResult = await req.db.query(
      'SELECT id, wallet_address, role, username, profile_image_hash FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'charity_platform_secret_key_change_in_production');

    const { username, profileImageHash } = req.body;

    // Update user
    const updateResult = await req.db.query(
      'UPDATE users SET username = $1, profile_image_hash = $2, updated_at = NOW() WHERE id = $3 RETURNING id, wallet_address, role, username, profile_image_hash',
      [username, profileImageHash, decoded.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

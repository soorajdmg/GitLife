import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Check username availability
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || username.trim().length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.json({ available: false, message: 'Only letters, numbers, hyphens, underscores allowed' });
    }
    const existing = await User.findByUsername(username.trim());
    return res.json({ available: !existing });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ available: false, message: 'Check failed' });
  }
});

// Register new user
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, fullName, username, password } = req.body;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create new user
    const user = await User.create({ email, fullName, username, password });

    // Generate token
    const token = generateToken(user.id, user.email, user.username);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl || null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Validate password
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(user.id, user.email, user.username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user (protected route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Google OAuth callback
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code is required' });

    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`;
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { email, name, picture, sub: googleId } = ticket.getPayload();

    // If user already exists, log them in
    let user = await User.findByEmail(email);
    if (user) {
      if (!user.googleId) {
        await User.update(user.id, { googleId, avatarUrl: picture || user.avatarUrl });
      }
      const token = generateToken(user.id, user.email, user.username);
      return res.json({
        message: 'Google login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName || '',
          avatarUrl: user.avatarUrl || null
        }
      });
    }

    // New user — return Google data so frontend can collect username + password
    res.json({
      needsSetup: true,
      googleData: { email, fullName: name, avatarUrl: picture, googleId }
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// Complete Google OAuth registration (new users only)
router.post('/google/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('googleId').notEmpty().withMessage('Google ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, fullName, username, password, avatarUrl, googleId } = req.body;

    const existingByEmail = await User.findByEmail(email);
    if (existingByEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingByUsername = await User.findByUsername(username);
    if (existingByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await User.create({ email, fullName, username, password, avatarUrl, googleId });
    const token = generateToken(user.id, user.email, user.username);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || null
      }
    });
  } catch (error) {
    console.error('Google register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Update current user profile (protected route)
router.put('/me', authenticateToken, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('avatarUrl').optional({ nullable: true }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, fullName, email, avatarUrl } = req.body;
    const updateData = {};

    if (username !== undefined) {
      // Check username availability (exclude current user)
      const existing = await User.findByUsername(username.trim());
      if (existing && existing.id !== req.user.userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updateData.username = username.trim();
    }

    if (email !== undefined) {
      const existing = await User.findByEmail(email);
      if (existing && existing.id !== req.user.userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updateData.email = email.toLowerCase().trim();
    }

    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await User.update(req.user.userId, updateData);
    const updated = await User.findById(req.user.userId);

    res.json({
      message: 'Profile updated',
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        fullName: updated.fullName || '',
        avatarUrl: updated.avatarUrl || null,
        createdAt: updated.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password (protected route)
router.put('/me/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userDoc = await User.findByEmail(req.user.email);
    if (!userDoc) return res.status(404).json({ error: 'User not found' });

    if (!userDoc.password) {
      return res.status(400).json({ error: 'Password change not available for OAuth accounts' });
    }

    const valid = await User.validatePassword(currentPassword, userDoc.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    const hashed = await bcrypt.default.hash(newPassword, salt);
    await User.update(req.user.userId, { password: hashed });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout (client-side handles token removal, this is just for completeness)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({
      valid: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        username: req.user.username,
        fullName: user?.fullName || '',
        avatarUrl: user?.avatarUrl || null
      }
    });
  } catch {
    res.json({
      valid: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        username: req.user.username,
        fullName: '',
        avatarUrl: null
      }
    });
  }
});

export default router;

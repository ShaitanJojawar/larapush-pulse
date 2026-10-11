const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'onesignal-super-secret-jwt-key-2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Support either username+password or single admin password
  const isValid = (username === ADMIN_USER && password === ADMIN_PASSWORD) || (password === ADMIN_PASSWORD);

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin credentials'
    });
  }

  const token = jwt.sign(
    { role: 'admin', user: ADMIN_USER },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(200).json({
    success: true,
    token,
    user: {
      username: ADMIN_USER,
      role: 'admin'
    }
  });
});

// Verify Current Session
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({
      success: true,
      user: {
        username: decoded.user || 'admin',
        role: decoded.role || 'admin'
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token expired or invalid' });
  }
});

module.exports = router;

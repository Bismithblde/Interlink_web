const express = require('express');
const router = express.Router();
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/authMiddleware');

// Public
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);

// Protected
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;

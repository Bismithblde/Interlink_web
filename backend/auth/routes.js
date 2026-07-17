const express = require('express');
const router = express.Router();
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/authMiddleware');
const enrichmentController = require('./controllers/enrichmentController');

// Public
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);

// Protected
router.get('/profile', authMiddleware, authController.getProfile);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.post('/profile/avatar-upload', authMiddleware, authController.createAvatarUpload);
router.get('/profile/enrichment', authMiddleware, enrichmentController.getStatus);
router.post('/profile/tags/:tagId/confirm', authMiddleware, enrichmentController.confirm);
router.post('/profile/tags/:tagId/dismiss', authMiddleware, enrichmentController.dismiss);

module.exports = router;

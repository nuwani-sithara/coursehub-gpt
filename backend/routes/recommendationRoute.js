const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const authMiddleware = require('../middlewares/auth');
const { recommendationLimiter } = require('../middlewares/rateLimit');

// Public route for general recommendations
router.post('/recommend', recommendationLimiter, recommendationController.getCourseRecommendations);

// Protected route for personalized recommendations based on user history
router.post('/recommend/personalized', authMiddleware, recommendationLimiter, recommendationController.getPersonalizedRecommendations);

// In your routes file, add these new routes:
router.get('/ai-status', recommendationController.getAIStatus);
router.post('/reset-requests', recommendationController.resetRequestCount); // For testing only

router.post('/test-gpt', recommendationController.testGPT);
router.get('/test-gpt-connectivity', recommendationController.testGPTConnectivity);

module.exports = router;
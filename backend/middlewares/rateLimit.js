const rateLimit = require('express-rate-limit');

// Rate limiting for AI recommendations
const recommendationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many recommendation requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { recommendationLimiter };
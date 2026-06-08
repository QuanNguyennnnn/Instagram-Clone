const router = require('express').Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const upload = require('../middlewares/upload.middleware');
const rateLimit = require('express-rate-limit');
const { param } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

// AI endpoints giới hạn 10 req/giờ/user
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Đã đạt giới hạn AI, thử lại sau 1 giờ' }
});

router.post(
  '/caption',
  authenticate,
  aiLimiter,
  uploadLimiter,
  upload.single('image'),
  aiController.generateCaption
);

router.get(
  '/smart-reply/:conversationId',
  authenticate,
  aiLimiter,
  [param('conversationId').isMongoId()],
  validate,
  aiController.generateSmartReply
);

module.exports = router;

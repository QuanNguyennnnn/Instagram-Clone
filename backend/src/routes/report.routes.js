const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const reportValidator = [
  body('targetId').isMongoId().withMessage('ID mục tiêu không hợp lệ'),
  body('targetType').isIn(['post', 'user']).withMessage('Loại mục tiêu phải là post hoặc user'),
  body('reason')
    .isIn(['spam', 'hate_speech', 'violence', 'nudity', 'misinformation', 'harassment', 'other'])
    .withMessage('Lý do không hợp lệ'),
  body('description').optional().isLength({ max: 500 }).withMessage('Mô tả tối đa 500 ký tự')
];

router.post('/', authenticate, reportValidator, validate, reportController.createReport);

module.exports = router;

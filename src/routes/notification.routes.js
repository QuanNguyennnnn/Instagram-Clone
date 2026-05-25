const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { param } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.patch('/read-all', authenticate, notificationController.markAllRead);
router.patch('/:id/read', authenticate, [param('id').isMongoId()], validate, notificationController.markRead);

module.exports = router;

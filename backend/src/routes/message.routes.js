const router = require('express').Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { param, body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const conversationIdValidator = [param('conversationId').isMongoId().withMessage('ID không hợp lệ')];
const userIdValidator = [param('userId').isMongoId().withMessage('ID không hợp lệ')];
const contentValidator = [body('content').trim().notEmpty().withMessage('Nội dung không được để trống')];

router.get('/conversations', authenticate, messageController.getConversations);
router.post('/conversations/:userId', authenticate, userIdValidator, validate, messageController.getOrCreateConversation);
router.get('/conversations/:conversationId', authenticate, conversationIdValidator, validate, messageController.getMessages);
router.post('/conversations/:conversationId/send', authenticate, conversationIdValidator, contentValidator, validate, messageController.sendMessage);
router.patch('/conversations/:conversationId/read', authenticate, conversationIdValidator, validate, messageController.markConversationRead);

module.exports = router;

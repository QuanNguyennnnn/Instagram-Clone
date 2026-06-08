const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');
const { param, body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

// Tất cả admin routes đều cần authenticate + requireAdmin
router.use(authenticate, requireAdmin);

const mongoIdParam = (name) => [param(name).isMongoId().withMessage('ID không hợp lệ')];

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/ban', mongoIdParam('userId'), validate, [
  body('banUntil').optional().isISO8601().withMessage('banUntil phải là ISO date')
], adminController.banUser);
router.patch('/users/:userId/unban', mongoIdParam('userId'), validate, adminController.unbanUser);

// ─── Posts ────────────────────────────────────────────────────────────────────
router.get('/posts', adminController.getPosts);
router.patch('/posts/:postId/hide', mongoIdParam('postId'), validate, adminController.hidePost);
router.patch('/posts/:postId/unhide', mongoIdParam('postId'), validate, adminController.unhidePost);
router.delete('/posts/:postId', mongoIdParam('postId'), validate, adminController.deletePost);

// ─── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports', adminController.getReports);
router.patch('/reports/:reportId/resolve', mongoIdParam('reportId'), [
  body('action').isIn(['hide_content', 'delete_content', 'dismiss']).withMessage('Action không hợp lệ'),
  body('resolution').optional().isLength({ max: 500 })
], validate, adminController.resolveReport);

// ─── Hashtags ─────────────────────────────────────────────────────────────────
router.get('/hashtags', adminController.getHashtags);

module.exports = router;

const router = require('express').Router();
const commentController = require('../controllers/comment.controller');
const {
  createCommentValidator,
  updateCommentValidator,
  commentIdParamValidator,
  postIdParamValidator
} = require('../validators/comment.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');

// ─── Comments on a post ───────────────────────────────────────────────────────
router.get('/post/:postId', optionalAuth, postIdParamValidator, validate, commentController.getComments);
router.post('/post/:postId', authenticate, postIdParamValidator, createCommentValidator, validate, commentController.createComment);

// ─── Single comment ───────────────────────────────────────────────────────────
router.patch('/:commentId', authenticate, commentIdParamValidator, updateCommentValidator, validate, commentController.updateComment);
router.delete('/:commentId', authenticate, commentIdParamValidator, validate, commentController.deleteComment);

// ─── Replies & Likes ──────────────────────────────────────────────────────────
router.get('/:commentId/replies', optionalAuth, commentIdParamValidator, validate, commentController.getReplies);
router.post('/:commentId/like', authenticate, commentIdParamValidator, validate, commentController.toggleCommentLike);

module.exports = router;

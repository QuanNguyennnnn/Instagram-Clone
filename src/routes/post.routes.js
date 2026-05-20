const router = require('express').Router();
const postController = require('../controllers/post.controller');
const { createPostValidator, updatePostValidator, postIdParamValidator } = require('../validators/post.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const upload = require('../middlewares/upload.middleware');

// ─── Feed & Explore ───────────────────────────────────────────────────────────
router.get('/feed', authenticate, postController.getFeed);
router.get('/explore', optionalAuth, postController.getExplore);
router.get('/saved', authenticate, postController.getSavedPosts);

// ─── By hashtag & by user ─────────────────────────────────────────────────────
router.get('/hashtag/:hashtag', optionalAuth, postController.getPostsByHashtag);
router.get('/user/:userId', optionalAuth, postController.getPostsByUser);

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  uploadLimiter,
  upload.array('media', 10),
  createPostValidator,
  validate,
  postController.createPost
);

router.get('/:postId', optionalAuth, postIdParamValidator, validate, postController.getPostById);
router.patch('/:postId', authenticate, postIdParamValidator, updatePostValidator, validate, postController.updatePost);
router.delete('/:postId', authenticate, postIdParamValidator, validate, postController.deletePost);

// ─── Interactions ─────────────────────────────────────────────────────────────
router.post('/:postId/like', authenticate, postIdParamValidator, validate, postController.toggleLike);
router.post('/:postId/save', authenticate, postIdParamValidator, validate, postController.toggleSave);

module.exports = router;

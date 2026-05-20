const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { updateProfileValidator, changePasswordValidator, userIdParamValidator } = require('../validators/user.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const upload = require('../middlewares/upload.middleware');

// ─── Current user ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, updateProfileValidator, validate, userController.updateProfile);
router.patch('/me/password', authenticate, changePasswordValidator, validate, userController.changePassword);
router.post('/me/avatar', authenticate, uploadLimiter, upload.single('avatar'), userController.uploadAvatar);
router.post('/me/cover', authenticate, uploadLimiter, upload.single('cover'), userController.uploadCoverPhoto);

// ─── Suggestions & Search ─────────────────────────────────────────────────────
router.get('/suggestions', authenticate, userController.getSuggestions);
router.get('/search', optionalAuth, userController.searchUsers);

// ─── Public profile ───────────────────────────────────────────────────────────
router.get('/:username', optionalAuth, userController.getUserProfile);

// ─── Follow ───────────────────────────────────────────────────────────────────
router.post('/:userId/follow', authenticate, userIdParamValidator, validate, userController.toggleFollow);

// ─── Followers / Following ────────────────────────────────────────────────────
router.get('/:userId/followers', optionalAuth, userIdParamValidator, validate, userController.getFollowers);
router.get('/:userId/following', optionalAuth, userIdParamValidator, validate, userController.getFollowing);

module.exports = router;

const router = require('express').Router();
const friendController = require('../controllers/friend.controller');
const { userIdParamValidator, requestIdParamValidator } = require('../validators/friend.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');

// ─── My requests & suggestions ────────────────────────────────────────────────
router.get('/requests', authenticate, friendController.getFriendRequests);
router.get('/requests/sent', authenticate, friendController.getSentRequests);
router.get('/suggestions', authenticate, friendController.getFriendSuggestions);

// ─── Friends list of a user ───────────────────────────────────────────────────
router.get('/:userId', optionalAuth, userIdParamValidator, validate, friendController.getFriends);

// ─── Send / Remove ────────────────────────────────────────────────────────────
router.post('/:userId/request', authenticate, userIdParamValidator, validate, friendController.sendFriendRequest);
router.delete('/:userId/remove', authenticate, userIdParamValidator, validate, friendController.removeFriend);

// ─── Accept / Decline / Cancel ───────────────────────────────────────────────
router.patch('/requests/:requestId/accept', authenticate, requestIdParamValidator, validate, friendController.acceptFriendRequest);
router.patch('/requests/:requestId/decline', authenticate, requestIdParamValidator, validate, friendController.declineFriendRequest);
router.delete('/requests/:requestId/cancel', authenticate, requestIdParamValidator, validate, friendController.cancelFriendRequest);

module.exports = router;

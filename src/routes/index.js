const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/posts', require('./post.routes'));
router.use('/comments', require('./comment.routes'));
router.use('/friends', require('./friend.routes'));
// router.use('/conversations', require('./conversation.routes'));
// router.use('/notifications', require('./notification.routes'));
// router.use('/search', require('./search.routes'));
// router.use('/ai', require('./ai.routes'));
// router.use('/admin', require('./admin.routes'));

module.exports = router;

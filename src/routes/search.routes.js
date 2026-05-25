const router = require('express').Router();
const searchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

router.get('/', optionalAuth, searchController.search);
router.get('/trending-hashtags', searchController.getTrendingHashtags);

module.exports = router;

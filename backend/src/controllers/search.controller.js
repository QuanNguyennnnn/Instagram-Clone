const searchService = require('../services/search.service');
const { success, error } = require('../utils/response');

const search = async (req, res) => {
  try {
    const { q, type } = req.query;
    const data = await searchService.search(q, type, req.user?._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getTrendingHashtags = async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const data = await searchService.getTrendingHashtags(limit);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = { search, getTrendingHashtags };

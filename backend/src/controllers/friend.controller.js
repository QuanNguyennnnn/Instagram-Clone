const friendService = require('../services/friend.service');
const { success, error } = require('../utils/response');

const getFriends = async (req, res) => {
  try {
    const data = await friendService.getFriends(req.params.userId, req.query, req.user?._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const data = await friendService.getFriendRequests(req.user._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getSentRequests = async (req, res) => {
  try {
    const data = await friendService.getSentRequests(req.user._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getFriendSuggestions = async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const suggestions = await friendService.getFriendSuggestions(req.user._id, limit);
    return success(res, { suggestions });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const result = await friendService.sendFriendRequest(req.user._id, req.params.userId);
    return success(res, result, 'Đã gửi lời mời kết bạn', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const result = await friendService.acceptFriendRequest(req.params.requestId, req.user._id);
    return success(res, result, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    const result = await friendService.declineFriendRequest(req.params.requestId, req.user._id);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const result = await friendService.cancelFriendRequest(req.params.requestId, req.user._id);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const removeFriend = async (req, res) => {
  try {
    const result = await friendService.removeFriend(req.user._id, req.params.userId);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = {
  getFriends,
  getFriendRequests,
  getSentRequests,
  getFriendSuggestions,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend
};

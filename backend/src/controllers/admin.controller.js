const adminService = require('../services/admin.service');
const { success, error } = require('../utils/response');

const getStats = async (req, res) => {
  try {
    const data = await adminService.getStats();
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const data = await adminService.getUsers(req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const banUser = async (req, res) => {
  try {
    const result = await adminService.banUser(req.params.userId, req.body);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const unbanUser = async (req, res) => {
  try {
    const result = await adminService.unbanUser(req.params.userId);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ─── Posts ────────────────────────────────────────────────────────────────────

const getPosts = async (req, res) => {
  try {
    const data = await adminService.getPosts(req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const hidePost = async (req, res) => {
  try {
    const result = await adminService.hidePost(req.params.postId);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const unhidePost = async (req, res) => {
  try {
    const result = await adminService.unhidePost(req.params.postId);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const deletePost = async (req, res) => {
  try {
    const result = await adminService.deletePostByAdmin(req.params.postId);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ─── Reports ──────────────────────────────────────────────────────────────────

const getReports = async (req, res) => {
  try {
    const data = await adminService.getReports(req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const resolveReport = async (req, res) => {
  try {
    const result = await adminService.resolveReport(req.params.reportId, req.user._id, req.body);
    return success(res, null, result.message);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ─── Hashtags ─────────────────────────────────────────────────────────────────

const getHashtags = async (req, res) => {
  try {
    const data = await adminService.getHashtags(req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = {
  getStats,
  getUsers, banUser, unbanUser,
  getPosts, hidePost, unhidePost, deletePost,
  getReports, resolveReport,
  getHashtags
};

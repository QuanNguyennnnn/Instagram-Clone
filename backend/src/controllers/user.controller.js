const userService = require('../services/user.service');
const { success, error } = require('../utils/response');

const getMe = async (req, res) => {
  try {
    const user = await userService.getMe(req.user._id);
    return success(res, { user });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    return success(res, { user }, 'Cập nhật thông tin thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const changePassword = async (req, res) => {
  try {
    await userService.changePassword(req.user._id, req.body);
    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const data = await userService.uploadAvatar(req.user._id, req.file);
    return success(res, data, 'Cập nhật ảnh đại diện thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const uploadCoverPhoto = async (req, res) => {
  try {
    const data = await userService.uploadCoverPhoto(req.user._id, req.file);
    return success(res, data, 'Cập nhật ảnh bìa thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getUserProfile = async (req, res) => {
  try {
    const profile = await userService.getUserProfile(req.params.username, req.user?._id);
    return success(res, { profile });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const toggleFollow = async (req, res) => {
  try {
    const result = await userService.toggleFollow(req.user._id, req.params.userId);
    return success(res, result, result.following ? 'Đã theo dõi' : 'Đã bỏ theo dõi');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getFollowers = async (req, res) => {
  try {
    const data = await userService.getFollowers(req.params.userId, req.query, req.user?._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getFollowing = async (req, res) => {
  try {
    const data = await userService.getFollowing(req.params.userId, req.query, req.user?._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getSuggestions = async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const suggestions = await userService.getSuggestions(req.user._id, limit);
    return success(res, { suggestions });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const searchUsers = async (req, res) => {
  try {
    const data = await userService.searchUsers(req.query.q, req.user?._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = {
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
  uploadCoverPhoto,
  getUserProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getSuggestions,
  searchUsers
};

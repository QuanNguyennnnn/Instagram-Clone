const postService = require('../services/post.service');
const { success, error } = require('../utils/response');

const createPost = async (req, res) => {
  try {
    const post = await postService.createPost(req.user._id, req.body, req.files || []);
    return success(res, { post }, 'Đăng bài thành công', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getFeed = async (req, res) => {
  try {
    const data = await postService.getFeed(req.user._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getExplore = async (req, res) => {
  try {
    const data = await postService.getExplore(req.user?._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.postId, req.user?._id);
    return success(res, { post });
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await postService.updatePost(req.params.postId, req.user._id, req.body);
    return success(res, { post }, 'Cập nhật bài viết thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const deletePost = async (req, res) => {
  try {
    await postService.deletePost(req.params.postId, req.user._id);
    return success(res, null, 'Đã xóa bài viết');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const toggleLike = async (req, res) => {
  try {
    const result = await postService.toggleLike(req.params.postId, req.user._id);
    return success(res, result, result.liked ? 'Đã thích' : 'Đã bỏ thích');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const toggleSave = async (req, res) => {
  try {
    const result = await postService.toggleSave(req.params.postId, req.user._id);
    return success(res, result, result.saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const data = await postService.getSavedPosts(req.user._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getPostsByHashtag = async (req, res) => {
  try {
    const data = await postService.getPostsByHashtag(req.params.hashtag, req.user?._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const data = await postService.getPostsByUser(req.params.userId, req.user?._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = {
  createPost,
  getFeed,
  getExplore,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  toggleSave,
  getSavedPosts,
  getPostsByHashtag,
  getPostsByUser
};

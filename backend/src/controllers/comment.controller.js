const commentService = require('../services/comment.service');
const { success, error } = require('../utils/response');

const getComments = async (req, res) => {
  try {
    const data = await commentService.getComments(req.params.postId, req.query, req.user?._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getReplies = async (req, res) => {
  try {
    const data = await commentService.getReplies(req.params.commentId, req.query, req.user?._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const createComment = async (req, res) => {
  try {
    const comment = await commentService.createComment(req.params.postId, req.user._id, req.body);
    return success(res, { comment }, 'Đã bình luận', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const updateComment = async (req, res) => {
  try {
    const comment = await commentService.updateComment(req.params.commentId, req.user._id, req.body);
    return success(res, { comment }, 'Đã cập nhật bình luận');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const deleteComment = async (req, res) => {
  try {
    await commentService.deleteComment(req.params.commentId, req.user._id);
    return success(res, null, 'Đã xóa bình luận');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const toggleCommentLike = async (req, res) => {
  try {
    const result = await commentService.toggleCommentLike(req.params.commentId, req.user._id);
    return success(res, result, result.liked ? 'Đã thích bình luận' : 'Đã bỏ thích');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = { getComments, getReplies, createComment, updateComment, deleteComment, toggleCommentLike };

const { body, param } = require('express-validator');

const createCommentValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung bình luận là bắt buộc')
    .isLength({ max: 1000 }).withMessage('Bình luận tối đa 1000 ký tự'),
  body('parentCommentId')
    .optional()
    .isMongoId().withMessage('ID bình luận cha không hợp lệ')
];

const updateCommentValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung bình luận là bắt buộc')
    .isLength({ max: 1000 }).withMessage('Bình luận tối đa 1000 ký tự')
];

const commentIdParamValidator = [
  param('commentId').isMongoId().withMessage('ID bình luận không hợp lệ')
];

const postIdParamValidator = [
  param('postId').isMongoId().withMessage('ID bài viết không hợp lệ')
];

module.exports = {
  createCommentValidator,
  updateCommentValidator,
  commentIdParamValidator,
  postIdParamValidator
};
const { body, param, query } = require('express-validator');

const createPostValidator = [
  body('content')
    .optional()
    .isLength({ max: 2200 }).withMessage('Nội dung tối đa 2200 ký tự'),
  body('privacy')
    .optional()
    .isIn(['public', 'friends', 'private']).withMessage('Privacy phải là public, friends hoặc private'),
  body('location')
    .optional()
    .isLength({ max: 100 }).withMessage('Địa điểm tối đa 100 ký tự'),
  body().custom((_, { req }) => {
    const hasContent = req.body.content && req.body.content.trim().length > 0;
    const hasFiles = req.files && req.files.length > 0;
    if (!hasContent && !hasFiles) throw new Error('Bài viết phải có nội dung hoặc ảnh/video');
    return true;
  })
];

const updatePostValidator = [
  body('content')
    .optional()
    .isLength({ max: 2200 }).withMessage('Nội dung tối đa 2200 ký tự'),
  body('privacy')
    .optional()
    .isIn(['public', 'friends', 'private']).withMessage('Privacy phải là public, friends hoặc private')
];

const postIdParamValidator = [
  param('postId').isMongoId().withMessage('ID bài viết không hợp lệ')
];

module.exports = { createPostValidator, updatePostValidator, postIdParamValidator };

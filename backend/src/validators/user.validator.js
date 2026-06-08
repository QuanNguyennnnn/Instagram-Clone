const { body, param } = require('express-validator');

const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Tên tối đa 50 ký tự'),
  body('bio')
    .optional()
    .isLength({ max: 150 }).withMessage('Bio tối đa 150 ký tự'),
  body('website')
    .optional()
    .custom((val) => {
      if (!val || val === '') return true;
      try { new URL(val); return true; } catch { throw new Error('Website không hợp lệ'); }
    }),
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate phải là boolean')
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('newPassword')
    .notEmpty().withMessage('Mật khẩu mới là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu mới phải ít nhất 6 ký tự'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Xác nhận mật khẩu không khớp');
    return true;
  })
];

const userIdParamValidator = [
  param('userId').isMongoId().withMessage('ID người dùng không hợp lệ')
];

module.exports = { updateProfileValidator, changePasswordValidator, userIdParamValidator };

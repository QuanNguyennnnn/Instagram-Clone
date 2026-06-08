const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim().notEmpty().withMessage('Username là bắt buộc')
    .isLength({ min: 3, max: 30 }).withMessage('Username phải từ 3-30 ký tự')
    .matches(/^[a-zA-Z0-9_.]+$/).withMessage('Username chỉ chứa chữ, số, dấu chấm và gạch dưới'),
  body('email')
    .trim().notEmpty().withMessage('Email là bắt buộc')
    .isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
  body('fullName')
    .trim().notEmpty().withMessage('Tên đầy đủ là bắt buộc')
    .isLength({ max: 50 }).withMessage('Tên tối đa 50 ký tự')
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email là bắt buộc').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc')
];

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage('Email là bắt buộc').isEmail().withMessage('Email không hợp lệ')
];

const resetPasswordValidator = [
  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Mật khẩu xác nhận không khớp');
    return true;
  })
];

module.exports = { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator };

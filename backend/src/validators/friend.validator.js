const { param } = require('express-validator');

const userIdParamValidator = [
  param('userId').isMongoId().withMessage('ID người dùng không hợp lệ')
];

const requestIdParamValidator = [
  param('requestId').isMongoId().withMessage('ID lời mời không hợp lệ')
];

module.exports = { userIdParamValidator, requestIdParamValidator };

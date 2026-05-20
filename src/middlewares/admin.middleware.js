const { error } = require('../utils/response');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 'Không có quyền truy cập', 403);
  }
  next();
};

module.exports = { requireAdmin };

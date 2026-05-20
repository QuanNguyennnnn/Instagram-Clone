const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return error(res, 'Không có token xác thực', 401);

    const decoded = verifyAccessToken(auth.split(' ')[1]);
    const user = await User.findById(decoded.id);
    if (!user) return error(res, 'Người dùng không tồn tại', 401);
    if (user.isBanned) return error(res, 'Tài khoản đã bị khóa', 403);

    req.user = user;
    next();
  } catch {
    return error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const decoded = verifyAccessToken(auth.split(' ')[1]);
      const user = await User.findById(decoded.id);
      if (user && !user.isBanned) req.user = user;
    }
  } catch {
    // silently ignore — optional means unauthenticated is allowed
  }
  next();
};

module.exports = { authenticate, optionalAuth };

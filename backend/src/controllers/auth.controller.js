const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return success(res, { user }, 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const user = await authService.verifyEmail(req.params.token);
    return success(res, { user }, 'Xác thực email thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const login = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return success(res, { user, accessToken }, 'Đăng nhập thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const { accessToken, refreshToken: newRefresh } = await authService.refreshToken(token);
    res.cookie('refreshToken', newRefresh, COOKIE_OPTIONS);
    return success(res, { accessToken }, 'Token đã được làm mới');
  } catch (err) {
    return error(res, err.message, err.status || 401);
  }
};

const logout = async (req, res) => {
  try {
    await authService.logout(req.user._id, req.cookies.refreshToken);
    res.clearCookie('refreshToken');
    return success(res, null, 'Đăng xuất thành công');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
    return success(res, null, 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    return success(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword };

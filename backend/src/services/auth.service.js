const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { addEmailJob } = require('../queues/email.queue');

const register = async ({ username, email, password, fullName }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? 'Email' : 'Username';
    throw { status: 409, message: `${field} đã được sử dụng` };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    username, email, password, fullName,
    emailVerificationToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000
  });

  await addEmailJob('verification', { email: user.email, token: rawToken, username: user.username });

  return user.toPublicJSON();
};

const verifyEmail = async (token) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() }
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) throw { status: 400, message: 'Token không hợp lệ hoặc đã hết hạn' };

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return user.toPublicJSON();
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
  }
  if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }
  if (user.isBanned) {
    const msg = user.banUntil
      ? `Tài khoản bị khóa đến ${new Date(user.banUntil).toLocaleDateString('vi-VN')}`
      : 'Tài khoản bị khóa vĩnh viễn';
    throw { status: 403, message: msg };
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  await user.save();

  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

const refreshToken = async (token) => {
  if (!token) throw { status: 401, message: 'Không có refresh token' };

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw { status: 401, message: 'Refresh token không hợp lệ hoặc đã hết hạn' };
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    throw { status: 401, message: 'Refresh token không hợp lệ' };
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, token) => {
  const user = await User.findById(userId).select('+refreshTokens');
  if (user && token) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    await user.save();
  }
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return; // Silent fail — do not reveal whether email exists

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  await user.save();

  await addEmailJob('password-reset', { email: user.email, token: rawToken, username: user.username });
};

const resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) throw { status: 400, message: 'Token không hợp lệ hoặc đã hết hạn' };

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];
  await user.save();
};

module.exports = { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword };

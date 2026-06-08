const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Hashtag = require('../models/Hashtag');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

const getStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOf30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersToday,
    activeUsers,
    bannedUsers,
    totalPosts,
    postsToday,
    hiddenPosts,
    pendingReports,
    topHashtags
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: startOf30DaysAgo } }),
    User.countDocuments({ isBanned: true }),
    Post.countDocuments({ isHidden: false }),
    Post.countDocuments({ createdAt: { $gte: startOfToday }, isHidden: false }),
    Post.countDocuments({ isHidden: true }),
    Report.countDocuments({ status: 'pending' }),
    Hashtag.find().sort({ postCount: -1 }).limit(5).select('name postCount')
  ]);

  return {
    users: { total: totalUsers, newToday: newUsersToday, active30Days: activeUsers, banned: bannedUsers },
    posts: { total: totalPosts, today: postsToday, hidden: hiddenPosts },
    reports: { pending: pendingReports },
    topHashtags
  };
};

// ─── User Management ──────────────────────────────────────────────────────────

const getUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { q, role, isBanned, isVerified } = query;

  const filter = {};
  if (q) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ username: regex }, { fullName: regex }, { email: regex }];
  }
  if (role) filter.role = role;
  if (isBanned !== undefined) filter.isBanned = isBanned === 'true';
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('username fullName email avatar role isVerified isBanned banUntil postCount followerCount createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  return { users, pagination: buildPaginationMeta(total, page, limit) };
};

const banUser = async (userId, { banUntil = null, reason = '' }) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  if (user.role === 'admin') throw { status: 403, message: 'Không thể khóa tài khoản admin' };

  user.isBanned = true;
  user.banUntil = banUntil ? new Date(banUntil) : null;
  // Invalidate all sessions
  user.refreshTokens = [];
  await user.save();

  return { message: banUntil ? `Đã khóa tài khoản đến ${new Date(banUntil).toLocaleDateString('vi-VN')}` : 'Đã khóa tài khoản vĩnh viễn' };
};

const unbanUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isBanned: false, banUntil: null },
    { new: true }
  );
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  return { message: 'Đã mở khóa tài khoản' };
};

// ─── Post Management ──────────────────────────────────────────────────────────

const getPosts = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { q, isHidden } = query;

  const filter = {};
  if (q) filter.$text = { $search: q.trim() };
  if (isHidden !== undefined) filter.isHidden = isHidden === 'true';

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar'),
    Post.countDocuments(filter)
  ]);

  return { posts, pagination: buildPaginationMeta(total, page, limit) };
};

const hidePost = async (postId) => {
  const post = await Post.findByIdAndUpdate(postId, { isHidden: true }, { new: true });
  if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
  return { message: 'Đã ẩn bài viết' };
};

const unhidePost = async (postId) => {
  const post = await Post.findByIdAndUpdate(postId, { isHidden: false }, { new: true });
  if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
  return { message: 'Đã hiện bài viết' };
};

const deletePostByAdmin = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };

  const { deleteFromCloudinary } = require('./upload.service');
  post.media.forEach(({ publicId, type }) => {
    deleteFromCloudinary(publicId, type === 'video' ? 'video' : 'image').catch(() => {});
  });

  await Promise.all([
    post.deleteOne(),
    User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } }),
    require('../models/Like').deleteMany({ targetId: postId, targetType: 'post' }),
    require('../models/SavedPost').deleteMany({ post: postId }),
    require('../models/Comment').deleteMany({ post: postId })
  ]);

  return { message: 'Đã xóa bài viết' };
};

// ─── Report Management ────────────────────────────────────────────────────────

const getReports = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { status } = query;

  const filter = {};
  if (status) filter.status = status;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reporter', 'username fullName avatar')
      .populate('reviewedBy', 'username'),
    Report.countDocuments(filter)
  ]);

  // Populate target (post hoặc user)
  const enriched = await Promise.all(
    reports.map(async (r) => {
      const obj = r.toObject();
      if (r.targetType === 'post') {
        obj.target = await Post.findById(r.targetId)
          .select('content media author isHidden')
          .populate('author', 'username');
      } else if (r.targetType === 'user') {
        obj.target = await User.findById(r.targetId).select('username fullName avatar isBanned');
      }
      return obj;
    })
  );

  return { reports: enriched, pagination: buildPaginationMeta(total, page, limit) };
};

const resolveReport = async (reportId, adminId, { action, resolution = '' }) => {
  const report = await Report.findById(reportId);
  if (!report) throw { status: 404, message: 'Báo cáo không tồn tại' };
  if (report.status !== 'pending') throw { status: 400, message: 'Báo cáo đã được xử lý' };

  const validActions = ['hide_content', 'delete_content', 'dismiss'];
  if (!validActions.includes(action)) throw { status: 400, message: 'Action không hợp lệ' };

  if (action === 'hide_content') {
    if (report.targetType === 'post') await hidePost(report.targetId);
    else if (report.targetType === 'user') await banUser(report.targetId, {});
  } else if (action === 'delete_content') {
    if (report.targetType === 'post') await deletePostByAdmin(report.targetId);
  }

  report.status = 'resolved';
  report.reviewedBy = adminId;
  report.resolution = resolution;
  await report.save();

  return { message: 'Đã xử lý báo cáo' };
};

// ─── Hashtag Management ───────────────────────────────────────────────────────

const getHashtags = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { q } = query;

  const filter = q ? { name: new RegExp(q.trim(), 'i') } : {};

  const [hashtags, total] = await Promise.all([
    Hashtag.find(filter).sort({ postCount: -1 }).skip(skip).limit(limit),
    Hashtag.countDocuments(filter)
  ]);

  return { hashtags, pagination: buildPaginationMeta(total, page, limit) };
};

module.exports = {
  getStats,
  getUsers,
  banUser,
  unbanUser,
  getPosts,
  hidePost,
  unhidePost,
  deletePostByAdmin,
  getReports,
  resolveReport,
  getHashtags
};

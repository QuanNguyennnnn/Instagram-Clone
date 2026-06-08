const User = require('../models/User');
const Follow = require('../models/Follow');
const Friendship = require('../models/Friendship');
const FriendRequest = require('../models/FriendRequest');
const Post = require('../models/Post');
const { uploadToCloudinary, deleteFromCloudinary } = require('./upload.service');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

// ─── Profile ──────────────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  return user.toPublicJSON();
};

const updateProfile = async (userId, { fullName, bio, website, isPrivate }) => {
  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName.trim();
  if (bio !== undefined) updates.bio = bio;
  if (website !== undefined) updates.website = website;
  if (isPrivate !== undefined) updates.isPrivate = isPrivate;

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  return user.toPublicJSON();
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password +refreshTokens');
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw { status: 400, message: 'Mật khẩu hiện tại không đúng' };

  user.password = newPassword;
  user.refreshTokens = []; // invalidate all sessions
  await user.save();
};

const uploadAvatar = async (userId, file) => {
  if (!file) throw { status: 400, message: 'Vui lòng chọn ảnh' };

  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  // Use deterministic publicId so Cloudinary auto-overwrites old avatar
  const publicId = `instagram-clone/avatars/${userId}`;
  if (user.avatar) {
    await deleteFromCloudinary(publicId, 'image').catch(() => {});
  }

  const result = await uploadToCloudinary(file.buffer, {
    public_id: publicId,
    overwrite: true,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
  });

  user.avatar = result.secure_url;
  await user.save();
  return { avatar: user.avatar };
};

const uploadCoverPhoto = async (userId, file) => {
  if (!file) throw { status: 400, message: 'Vui lòng chọn ảnh' };

  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  const publicId = `instagram-clone/covers/${userId}`;
  if (user.coverPhoto) {
    await deleteFromCloudinary(publicId, 'image').catch(() => {});
  }

  const result = await uploadToCloudinary(file.buffer, {
    public_id: publicId,
    overwrite: true,
    transformation: [{ width: 1200, height: 400, crop: 'fill' }]
  });

  user.coverPhoto = result.secure_url;
  await user.save();
  return { coverPhoto: user.coverPhoto };
};

// ─── Public Profile ───────────────────────────────────────────────────────────

const getUserProfile = async (username, currentUserId) => {
  const user = await User.findOne({ username, isBanned: false });
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  const profile = user.toPublicJSON();

  if (!currentUserId || user._id.toString() === currentUserId.toString()) {
    return { ...profile, followStatus: null, friendStatus: null, isOwnProfile: !currentUserId || user._id.toString() === currentUserId.toString() };
  }

  const [followDoc, reverseFollow, friendRequest, friendship] = await Promise.all([
    Follow.findOne({ follower: currentUserId, following: user._id }),
    Follow.findOne({ follower: user._id, following: currentUserId }),
    FriendRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: user._id },
        { sender: user._id, receiver: currentUserId }
      ]
    }).sort({ createdAt: -1 }),
    Friendship.findOne({ users: { $all: [currentUserId, user._id] } })
  ]);

  let friendStatus = 'none';
  if (friendship) {
    friendStatus = 'friends';
  } else if (friendRequest && friendRequest.status === 'pending') {
    friendStatus = friendRequest.sender.toString() === currentUserId.toString()
      ? 'request_sent'
      : 'request_received';
  }

  return {
    ...profile,
    isOwnProfile: false,
    followStatus: {
      isFollowing: !!followDoc,
      isFollowedByYou: !!followDoc,
      isFollowingYou: !!reverseFollow,
      isMutual: !!followDoc && !!reverseFollow
    },
    friendStatus
  };
};

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

const toggleFollow = async (followerId, targetUserId) => {
  if (followerId.toString() === targetUserId.toString()) {
    throw { status: 400, message: 'Không thể tự follow bản thân' };
  }

  const target = await User.findById(targetUserId);
  if (!target || target.isBanned) throw { status: 404, message: 'Người dùng không tồn tại' };

  const existing = await Follow.findOne({ follower: followerId, following: targetUserId });

  if (existing) {
    await existing.deleteOne();
    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(targetUserId, { $inc: { followerCount: -1 } })
    ]);
    return { following: false, followerCount: Math.max(0, target.followerCount - 1) };
  }

  await Follow.create({ follower: followerId, following: targetUserId });
  await Promise.all([
    User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }),
    User.findByIdAndUpdate(targetUserId, { $inc: { followerCount: 1 } })
  ]);
  return { following: true, followerCount: target.followerCount + 1 };
};

// ─── Followers / Following Lists ──────────────────────────────────────────────

const getFollowers = async (userId, query, currentUserId) => {
  const { page, limit, skip } = getPaginationParams(query);

  const target = await User.findById(userId);
  if (!target) throw { status: 404, message: 'Người dùng không tồn tại' };

  const [followers, total] = await Promise.all([
    Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'username fullName avatar isVerified'),
    Follow.countDocuments({ following: userId })
  ]);

  let followingSet = new Set();
  if (currentUserId) {
    const myFollows = await Follow.find({
      follower: currentUserId,
      following: { $in: followers.map((f) => f.follower._id) }
    }).select('following');
    followingSet = new Set(myFollows.map((f) => f.following.toString()));
  }

  const data = followers.map((f) => ({
    ...f.follower.toObject(),
    isFollowing: followingSet.has(f.follower._id.toString()),
    followedAt: f.createdAt
  }));

  return { followers: data, pagination: buildPaginationMeta(total, page, limit) };
};

const getFollowing = async (userId, query, currentUserId) => {
  const { page, limit, skip } = getPaginationParams(query);

  const target = await User.findById(userId);
  if (!target) throw { status: 404, message: 'Người dùng không tồn tại' };

  const [following, total] = await Promise.all([
    Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('following', 'username fullName avatar isVerified'),
    Follow.countDocuments({ follower: userId })
  ]);

  let followingSet = new Set();
  if (currentUserId) {
    const myFollows = await Follow.find({
      follower: currentUserId,
      following: { $in: following.map((f) => f.following._id) }
    }).select('following');
    followingSet = new Set(myFollows.map((f) => f.following.toString()));
  }

  const data = following.map((f) => ({
    ...f.following.toObject(),
    isFollowing: followingSet.has(f.following._id.toString()),
    followedAt: f.createdAt
  }));

  return { following: data, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Suggestions ──────────────────────────────────────────────────────────────

const getSuggestions = async (currentUserId, limit = 10) => {
  const myFollows = await Follow.find({ follower: currentUserId }).select('following');
  const followingIds = myFollows.map((f) => f.following);

  const excluded = [...followingIds, currentUserId];

  // Get users I don't follow, prioritize verified & active accounts
  const suggestions = await User.find({
    _id: { $nin: excluded },
    isBanned: false,
    isVerified: true
  })
    .select('username fullName avatar isVerified followerCount')
    .sort({ followerCount: -1 })
    .limit(limit);

  // Fill up with non-verified if not enough
  if (suggestions.length < limit) {
    const moreExcluded = [...excluded, ...suggestions.map((u) => u._id)];
    const more = await User.find({ _id: { $nin: moreExcluded }, isBanned: false })
      .select('username fullName avatar isVerified followerCount')
      .sort({ followerCount: -1 })
      .limit(limit - suggestions.length);
    suggestions.push(...more);
  }

  return suggestions;
};

// ─── Search ──────────────────────────────────────────────────────────────────

const searchUsers = async (q, currentUserId, query) => {
  if (!q || q.trim().length < 1) return { users: [], pagination: buildPaginationMeta(0, 1, 20) };

  const { page, limit, skip } = getPaginationParams(query);
  const regex = new RegExp(q.trim(), 'i');

  const filter = {
    isBanned: false,
    $or: [{ username: regex }, { fullName: regex }]
  };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('username fullName avatar isVerified followerCount')
      .sort({ followerCount: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  let followingSet = new Set();
  if (currentUserId) {
    const myFollows = await Follow.find({
      follower: currentUserId,
      following: { $in: users.map((u) => u._id) }
    }).select('following');
    followingSet = new Set(myFollows.map((f) => f.following.toString()));
  }

  const data = users.map((u) => ({
    ...u.toObject(),
    isFollowing: followingSet.has(u._id.toString())
  }));

  return { users: data, pagination: buildPaginationMeta(total, page, limit) };
};

module.exports = {
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
  uploadCoverPhoto,
  getUserProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getSuggestions,
  searchUsers
};

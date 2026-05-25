const User = require('../models/User');
const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');
const Follow = require('../models/Follow');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

const search = async (q, type, currentUserId, query) => {
  if (!q || q.trim().length < 1) {
    return { users: [], posts: [], hashtags: [] };
  }

  const trimmed = q.trim();
  const { page, limit, skip } = getPaginationParams(query);

  const results = {};

  if (!type || type === 'users') {
    const regex = new RegExp(trimmed, 'i');
    const [users, total] = await Promise.all([
      User.find({ isBanned: false, $or: [{ username: regex }, { fullName: regex }] })
        .select('username fullName avatar isVerified followerCount')
        .sort({ followerCount: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ isBanned: false, $or: [{ username: regex }, { fullName: regex }] })
    ]);

    let followingSet = new Set();
    if (currentUserId && users.length) {
      const myFollows = await Follow.find({
        follower: currentUserId,
        following: { $in: users.map((u) => u._id) }
      }).select('following');
      followingSet = new Set(myFollows.map((f) => f.following.toString()));
    }

    results.users = {
      data: users.map((u) => ({ ...u.toObject(), isFollowing: followingSet.has(u._id.toString()) })),
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  if (!type || type === 'posts') {
    const [posts, total] = await Promise.all([
      Post.find({ privacy: 'public', isHidden: false, $text: { $search: trimmed } })
        .select('content media likeCount commentCount createdAt author hashtags')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username fullName avatar isVerified'),
      Post.countDocuments({ privacy: 'public', isHidden: false, $text: { $search: trimmed } })
    ]);

    results.posts = { data: posts, pagination: buildPaginationMeta(total, page, limit) };
  }

  if (!type || type === 'hashtags') {
    const regex = new RegExp(trimmed.replace(/^#/, ''), 'i');
    const [hashtags, total] = await Promise.all([
      Hashtag.find({ name: regex }).sort({ postCount: -1 }).skip(skip).limit(limit),
      Hashtag.countDocuments({ name: regex })
    ]);

    results.hashtags = { data: hashtags, pagination: buildPaginationMeta(total, page, limit) };
  }

  return results;
};

const getTrendingHashtags = async (limit = 10) => {
  const hashtags = await Hashtag.find({ postCount: { $gt: 0 } })
    .sort({ postCount: -1 })
    .limit(Math.min(20, limit));
  return { hashtags };
};

module.exports = { search, getTrendingHashtags };

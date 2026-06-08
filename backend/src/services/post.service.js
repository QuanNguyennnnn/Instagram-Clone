const Post = require('../models/Post');
const User = require('../models/User');
const Like = require('../models/Like');
const SavedPost = require('../models/SavedPost');
const Hashtag = require('../models/Hashtag');
const Follow = require('../models/Follow');
const Friendship = require('../models/Friendship');
const { uploadToCloudinary, deleteFromCloudinary } = require('./upload.service');
const { extractHashtags, extractMentions, getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const enrichPosts = async (posts, currentUserId) => {
  if (!posts.length || !currentUserId) {
    return posts.map((p) => ({ ...(p.toObject ? p.toObject() : p), isLiked: false, isSaved: false }));
  }

  const postIds = posts.map((p) => p._id);
  const [likes, saves] = await Promise.all([
    Like.find({ user: currentUserId, targetId: { $in: postIds }, targetType: 'post' }).select('targetId'),
    SavedPost.find({ user: currentUserId, post: { $in: postIds } }).select('post')
  ]);

  const likedSet = new Set(likes.map((l) => l.targetId.toString()));
  const savedSet = new Set(saves.map((s) => s.post.toString()));

  return posts.map((p) => {
    const obj = p.toObject ? p.toObject() : p;
    return { ...obj, isLiked: likedSet.has(p._id.toString()), isSaved: savedSet.has(p._id.toString()) };
  });
};

const upsertHashtags = async (tags) => {
  if (!tags.length) return;
  await Promise.all(
    tags.map((name) =>
      Hashtag.findOneAndUpdate({ name }, { $inc: { postCount: 1 } }, { upsert: true, new: true })
    )
  );
};

const decrementHashtags = async (tags) => {
  if (!tags.length) return;
  await Hashtag.updateMany({ name: { $in: tags } }, { $inc: { postCount: -1 } });
};

const getSocialContext = async (userId) => {
  const [follows, friendships] = await Promise.all([
    Follow.find({ follower: userId }).select('following'),
    Friendship.find({ users: userId }).select('users')
  ]);
  const followingIds = follows.map((f) => f.following);
  const friendIds = friendships.map((f) => f.users.find((u) => u.toString() !== userId.toString()));
  return { followingIds, friendIds };
};

// ─── Create ───────────────────────────────────────────────────────────────────

const createPost = async (userId, { content = '', privacy = 'public', location = '' }, files = []) => {
  // Upload media concurrently
  const uploadedMedia = await Promise.all(
    files.map(async (file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'instagram-clone/posts',
        resource_type: isVideo ? 'video' : 'image',
        ...(isVideo ? {} : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] })
      });
      return { url: result.secure_url, type: isVideo ? 'video' : 'image', publicId: result.public_id };
    })
  );

  const hashtags = extractHashtags(content);
  const mentionUsernames = extractMentions(content);

  // Resolve mentioned usernames → ObjectIds
  let mentions = [];
  if (mentionUsernames.length) {
    const mentionedUsers = await User.find({
      username: { $in: mentionUsernames },
      isBanned: false
    }).select('_id');
    mentions = mentionedUsers.map((u) => u._id);
  }

  const post = await Post.create({
    author: userId,
    content,
    media: uploadedMedia,
    hashtags,
    mentions,
    privacy,
    location
  });

  await Promise.all([
    upsertHashtags(hashtags),
    User.findByIdAndUpdate(userId, { $inc: { postCount: 1 } })
  ]);

  // Trigger AI moderation async (fire-and-forget, không block response)
  if (content && content.trim()) {
    const { addModerationJob } = require('../queues/ai-moderation.queue');
    addModerationJob(post._id.toString(), content).catch(() => {});
  }

  return post.populate('author', 'username fullName avatar isVerified');
};

// ─── Read ─────────────────────────────────────────────────────────────────────

const getPostById = async (postId, currentUserId) => {
  const post = await Post.findById(postId)
    .populate('author', 'username fullName avatar isVerified isPrivate')
    .populate('mentions', 'username fullName avatar');

  if (!post || post.isHidden) throw { status: 404, message: 'Bài viết không tồn tại' };

  // Privacy check for non-author
  if (post.author._id.toString() !== currentUserId?.toString()) {
    if (post.privacy === 'private') throw { status: 403, message: 'Bài viết này là riêng tư' };

    if (post.privacy === 'friends') {
      const isFriend = await Friendship.findOne({ users: { $all: [currentUserId, post.author._id] } });
      if (!isFriend) throw { status: 403, message: 'Bài viết chỉ dành cho bạn bè' };
    }
  }

  const enriched = await enrichPosts([post], currentUserId);
  return enriched[0];
};

const getFeed = async (userId, query) => {
  const limit = Math.min(20, Math.max(1, parseInt(query.limit) || 10));
  const cursor = query.cursor || null; // last post _id from previous page

  const { followingIds, friendIds } = await getSocialContext(userId);

  const feedConditions = [
    { author: userId, isHidden: false },
    { author: { $in: followingIds }, privacy: 'public', isHidden: false },
    { author: { $in: friendIds }, privacy: { $in: ['public', 'friends'] }, isHidden: false }
  ];

  const baseFilter = { $or: feedConditions };
  if (cursor) baseFilter._id = { $lt: cursor };

  const posts = await Post.find(baseFilter)
    .sort({ _id: -1 })
    .limit(limit)
    .populate('author', 'username fullName avatar isVerified')
    .populate('mentions', 'username');

  const enriched = await enrichPosts(posts, userId);
  const nextCursor = posts.length === limit ? posts[posts.length - 1]._id : null;

  return { posts: enriched, nextCursor, hasMore: !!nextCursor };
};

const getExplore = async (currentUserId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [posts, total] = await Promise.all([
    Post.find({ privacy: 'public', isHidden: false })
      .sort({ likeCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar isVerified'),
    Post.countDocuments({ privacy: 'public', isHidden: false })
  ]);

  const enriched = await enrichPosts(posts, currentUserId);
  return { posts: enriched, pagination: buildPaginationMeta(total, page, limit) };
};

const getPostsByUser = async (profileUserId, currentUserId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const isOwn = profileUserId.toString() === currentUserId?.toString();

  let privacyFilter;
  if (isOwn) {
    privacyFilter = {};
  } else {
    const isFriend = currentUserId
      ? await Friendship.findOne({ users: { $all: [currentUserId, profileUserId] } })
      : null;
    privacyFilter = isFriend
      ? { privacy: { $in: ['public', 'friends'] } }
      : { privacy: 'public' };
  }

  const filter = { author: profileUserId, isHidden: false, ...privacyFilter };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar isVerified'),
    Post.countDocuments(filter)
  ]);

  const enriched = await enrichPosts(posts, currentUserId);
  return { posts: enriched, pagination: buildPaginationMeta(total, page, limit) };
};

const getPostsByHashtag = async (hashtagName, currentUserId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const tag = hashtagName.toLowerCase().replace(/^#/, '');

  const filter = { hashtags: tag, privacy: 'public', isHidden: false };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar isVerified'),
    Post.countDocuments(filter)
  ]);

  const enriched = await enrichPosts(posts, currentUserId);
  return { hashtag: tag, posts: enriched, pagination: buildPaginationMeta(total, page, limit) };
};

const getSavedPosts = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [saved, total] = await Promise.all([
    SavedPost.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'post',
        match: { isHidden: false },
        populate: { path: 'author', select: 'username fullName avatar isVerified' }
      }),
    SavedPost.countDocuments({ user: userId })
  ]);

  // Filter out nulls (post may have been deleted or hidden)
  const posts = saved.filter((s) => s.post).map((s) => ({ ...s.post.toObject(), isSaved: true, isLiked: false }));

  // Enrich like status
  if (posts.length) {
    const postIds = posts.map((p) => p._id);
    const likes = await Like.find({ user: userId, targetId: { $in: postIds }, targetType: 'post' }).select('targetId');
    const likedSet = new Set(likes.map((l) => l.targetId.toString()));
    posts.forEach((p) => { p.isLiked = likedSet.has(p._id.toString()); });
  }

  return { posts, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updatePost = async (postId, userId, { content, privacy }) => {
  const post = await Post.findById(postId);
  if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
  if (post.author.toString() !== userId.toString()) throw { status: 403, message: 'Không có quyền chỉnh sửa' };

  const oldHashtags = [...post.hashtags];

  if (content !== undefined) {
    const newHashtags = extractHashtags(content);

    const removed = oldHashtags.filter((t) => !newHashtags.includes(t));
    const added = newHashtags.filter((t) => !oldHashtags.includes(t));

    await Promise.all([decrementHashtags(removed), upsertHashtags(added)]);

    const mentionUsernames = extractMentions(content);
    let mentions = [];
    if (mentionUsernames.length) {
      const mentionedUsers = await User.find({ username: { $in: mentionUsernames }, isBanned: false }).select('_id');
      mentions = mentionedUsers.map((u) => u._id);
    }

    post.content = content;
    post.hashtags = newHashtags;
    post.mentions = mentions;
  }

  if (privacy !== undefined) post.privacy = privacy;

  await post.save();
  return post.populate('author', 'username fullName avatar isVerified');
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deletePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw { status: 404, message: 'Bài viết không tồn tại' };
  if (post.author.toString() !== userId.toString()) throw { status: 403, message: 'Không có quyền xóa' };

  // Delete media from Cloudinary (non-blocking)
  post.media.forEach(({ publicId, type }) => {
    deleteFromCloudinary(publicId, type === 'video' ? 'video' : 'image').catch(() => {});
  });

  await Promise.all([
    post.deleteOne(),
    Like.deleteMany({ targetId: postId, targetType: 'post' }),
    SavedPost.deleteMany({ post: postId }),
    decrementHashtags(post.hashtags),
    User.findByIdAndUpdate(userId, { $inc: { postCount: -1 } })
  ]);
};

// ─── Like ─────────────────────────────────────────────────────────────────────

const toggleLike = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post || post.isHidden) throw { status: 404, message: 'Bài viết không tồn tại' };

  const existing = await Like.findOne({ user: userId, targetId: postId, targetType: 'post' });

  if (existing) {
    await existing.deleteOne();
    const updated = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: -1 } },
      { new: true }
    ).select('likeCount');
    return { liked: false, likeCount: Math.max(0, updated.likeCount) };
  }

  await Like.create({ user: userId, targetId: postId, targetType: 'post' });
  const updated = await Post.findByIdAndUpdate(
    postId,
    { $inc: { likeCount: 1 } },
    { new: true }
  ).select('likeCount');
  return { liked: true, likeCount: updated.likeCount, authorId: post.author };
};

// ─── Save ─────────────────────────────────────────────────────────────────────

const toggleSave = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post || post.isHidden) throw { status: 404, message: 'Bài viết không tồn tại' };

  const existing = await SavedPost.findOne({ user: userId, post: postId });

  if (existing) {
    await existing.deleteOne();
    const updated = await Post.findByIdAndUpdate(
      postId,
      { $inc: { saveCount: -1 } },
      { new: true }
    ).select('saveCount');
    return { saved: false, saveCount: Math.max(0, updated.saveCount) };
  }

  await SavedPost.create({ user: userId, post: postId });
  const updated = await Post.findByIdAndUpdate(
    postId,
    { $inc: { saveCount: 1 } },
    { new: true }
  ).select('saveCount');
  return { saved: true, saveCount: updated.saveCount };
};

module.exports = {
  createPost,
  getPostById,
  getFeed,
  getExplore,
  getPostsByUser,
  getPostsByHashtag,
  getSavedPosts,
  updatePost,
  deletePost,
  toggleLike,
  toggleSave
};

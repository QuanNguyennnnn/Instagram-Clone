const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Like = require('../models/Like');
const { extractMentions, getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notification.helper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const enrichComments = async (comments, currentUserId) => {
  if (!comments.length || !currentUserId) {
    return comments.map((c) => ({ ...(c.toObject ? c.toObject() : c), isLiked: false }));
  }

  const commentIds = comments.map((c) => c._id);
  const likes = await Like.find({
    user: currentUserId,
    targetId: { $in: commentIds },
    targetType: 'comment'
  }).select('targetId');

  const likedSet = new Set(likes.map((l) => l.targetId.toString()));

  return comments.map((c) => {
    const obj = c.toObject ? c.toObject() : c;
    return { ...obj, isLiked: likedSet.has(c._id.toString()) };
  });
};

// ─── Get Comments ─────────────────────────────────────────────────────────────

const getComments = async (postId, query, currentUserId) => {
  const post = await Post.findById(postId);
  if (!post || post.isHidden) throw { status: 404, message: 'Bài viết không tồn tại' };

  const { page, limit, skip } = getPaginationParams(query);

  const filter = { post: postId, parentComment: null };

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar isVerified'),
    Comment.countDocuments(filter)
  ]);

  const enriched = await enrichComments(comments, currentUserId);
  return { comments: enriched, pagination: buildPaginationMeta(total, page, limit) };
};

const getReplies = async (commentId, query, currentUserId) => {
  const parent = await Comment.findById(commentId);
  if (!parent) throw { status: 404, message: 'Bình luận không tồn tại' };

  const { page, limit, skip } = getPaginationParams(query);

  const [replies, total] = await Promise.all([
    Comment.find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar isVerified'),
    Comment.countDocuments({ parentComment: commentId })
  ]);

  const enriched = await enrichComments(replies, currentUserId);
  return { replies: enriched, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Create Comment ───────────────────────────────────────────────────────────

const createComment = async (postId, userId, { content, parentCommentId = null }) => {
  const post = await Post.findById(postId);
  if (!post || post.isHidden) throw { status: 404, message: 'Bài viết không tồn tại' };

  let parentComment = null;
  if (parentCommentId) {
    parentComment = await Comment.findById(parentCommentId);
    if (!parentComment || parentComment.post.toString() !== postId.toString()) {
      throw { status: 400, message: 'Bình luận cha không hợp lệ' };
    }
    // Only allow 1-level nesting — replies cannot be nested further
    if (parentComment.parentComment) {
      throw { status: 400, message: 'Chỉ hỗ trợ trả lời 1 cấp' };
    }
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
    parentComment: parentCommentId || null
  });

  // Increment counts
  const countUpdates = [Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } })];
  if (parentCommentId) {
    countUpdates.push(Comment.findByIdAndUpdate(parentCommentId, { $inc: { replyCount: 1 } }));
  }
  await Promise.all(countUpdates);

  // Notifications (fire-and-forget)
  const notifPromises = [];

  // Notify post author about new comment
  if (post.author.toString() !== userId.toString()) {
    notifPromises.push(
      createNotification({
        recipient: post.author,
        sender: userId,
        type: 'comment',
        targetId: post._id,
        targetType: 'post'
      })
    );
  }

  // Notify parent comment author about reply (if different from post author)
  if (parentComment && parentComment.author.toString() !== userId.toString()) {
    notifPromises.push(
      createNotification({
        recipient: parentComment.author,
        sender: userId,
        type: 'comment',
        targetId: comment._id,
        targetType: 'comment'
      })
    );
  }

  // Notify mentioned users
  const mentionedUsernames = extractMentions(content);
  if (mentionedUsernames.length) {
    const User = require('../models/User');
    const mentionedUsers = await User.find({
      username: { $in: mentionedUsernames },
      isBanned: false,
      _id: { $ne: userId }
    }).select('_id');

    mentionedUsers.forEach((u) => {
      notifPromises.push(
        createNotification({
          recipient: u._id,
          sender: userId,
          type: 'mention',
          targetId: comment._id,
          targetType: 'comment'
        })
      );
    });
  }

  Promise.all(notifPromises).catch(() => {});

  return comment.populate('author', 'username fullName avatar isVerified');
};

// ─── Update Comment ───────────────────────────────────────────────────────────

const updateComment = async (commentId, userId, { content }) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw { status: 404, message: 'Bình luận không tồn tại' };
  if (comment.author.toString() !== userId.toString()) {
    throw { status: 403, message: 'Không có quyền chỉnh sửa bình luận này' };
  }

  comment.content = content;
  await comment.save();

  return comment.populate('author', 'username fullName avatar isVerified');
};

// ─── Delete Comment ───────────────────────────────────────────────────────────

const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId).populate('post', 'author');
  if (!comment) throw { status: 404, message: 'Bình luận không tồn tại' };

  const isAuthor = comment.author.toString() === userId.toString();
  const isPostAuthor = comment.post.author.toString() === userId.toString();
  if (!isAuthor && !isPostAuthor) {
    throw { status: 403, message: 'Không có quyền xóa bình luận này' };
  }

  const isTopLevel = !comment.parentComment;

  if (isTopLevel) {
    // Delete all replies and their likes
    const replies = await Comment.find({ parentComment: commentId }).select('_id');
    const replyIds = replies.map((r) => r._id);

    await Promise.all([
      Comment.deleteMany({ parentComment: commentId }),
      Like.deleteMany({ targetId: { $in: replyIds }, targetType: 'comment' }),
      Like.deleteMany({ targetId: commentId, targetType: 'comment' }),
      comment.deleteOne(),
      Post.findByIdAndUpdate(comment.post._id, {
        $inc: { commentCount: -(1 + comment.replyCount) }
      })
    ]);
  } else {
    await Promise.all([
      Like.deleteMany({ targetId: commentId, targetType: 'comment' }),
      comment.deleteOne(),
      Comment.findByIdAndUpdate(comment.parentComment, { $inc: { replyCount: -1 } }),
      Post.findByIdAndUpdate(comment.post._id, { $inc: { commentCount: -1 } })
    ]);
  }
};

// ─── Toggle Like ──────────────────────────────────────────────────────────────

const toggleCommentLike = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw { status: 404, message: 'Bình luận không tồn tại' };

  const existing = await Like.findOne({ user: userId, targetId: commentId, targetType: 'comment' });

  if (existing) {
    await existing.deleteOne();
    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { likeCount: -1 } },
      { new: true }
    ).select('likeCount');
    return { liked: false, likeCount: Math.max(0, updated.likeCount) };
  }

  await Like.create({ user: userId, targetId: commentId, targetType: 'comment' });
  const updated = await Comment.findByIdAndUpdate(
    commentId,
    { $inc: { likeCount: 1 } },
    { new: true }
  ).select('likeCount');

  createNotification({
    recipient: comment.author,
    sender: userId,
    type: 'like',
    targetId: commentId,
    targetType: 'comment'
  }).catch(() => {});

  return { liked: true, likeCount: updated.likeCount };
};

module.exports = {
  getComments,
  getReplies,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike
};

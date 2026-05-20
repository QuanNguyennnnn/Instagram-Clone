const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likeCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 }
}, { timestamps: true });

commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);

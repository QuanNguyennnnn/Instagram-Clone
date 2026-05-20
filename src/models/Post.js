const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  publicId: { type: String, required: true }
}, { _id: false });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 2200, default: '' },
  media: { type: [mediaSchema], default: [] },
  hashtags: [{ type: String, lowercase: true, trim: true }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  privacy: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  isHidden: { type: Boolean, default: false },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  saveCount: { type: Number, default: 0 }
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);

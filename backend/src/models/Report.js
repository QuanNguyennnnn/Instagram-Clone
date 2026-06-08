const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ['post', 'user'], required: true },
  reason: {
    type: String,
    enum: ['spam', 'hate_speech', 'violence', 'nudity', 'misinformation', 'harassment', 'other'],
    required: true
  },
  description: { type: String, maxlength: 500, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolution: { type: String, default: '' }
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, targetId: 1, targetType: 1 });

module.exports = mongoose.model('Report', reportSchema);

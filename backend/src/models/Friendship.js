const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }]
}, { timestamps: true });

friendshipSchema.index({ users: 1 });

module.exports = mongoose.model('Friendship', friendshipSchema);

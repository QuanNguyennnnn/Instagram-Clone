const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true, trim: true,
    minlength: 3, maxlength: 30,
    match: [/^[a-zA-Z0-9_.]+$/, 'Username chỉ chứa chữ, số, dấu chấm và gạch dưới']
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  fullName: { type: String, required: true, trim: true, maxlength: 50 },
  avatar: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  bio: { type: String, maxlength: 150, default: '' },
  website: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banUntil: { type: Date, default: null },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  refreshTokens: { type: [String], select: false, default: [] }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    avatar: this.avatar,
    coverPhoto: this.coverPhoto,
    bio: this.bio,
    website: this.website,
    role: this.role,
    isVerified: this.isVerified,
    isPrivate: this.isPrivate,
    isBanned: this.isBanned,
    followerCount: this.followerCount,
    followingCount: this.followingCount,
    postCount: this.postCount,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);

const FriendRequest = require('../models/FriendRequest');
const Friendship = require('../models/Friendship');
const Follow = require('../models/Follow');
const User = require('../models/User');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notification.helper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMyFriendIds = async (userId) => {
  const friendships = await Friendship.find({ users: userId }).select('users');
  return friendships.map((f) => f.users.find((u) => u.toString() !== userId.toString()));
};

const getMyPendingIds = async (userId) => {
  const requests = await FriendRequest.find({
    $or: [{ sender: userId }, { receiver: userId }],
    status: 'pending'
  }).select('sender receiver');
  return requests.flatMap((r) => [r.sender.toString(), r.receiver.toString()]);
};

// ─── Friends List ─────────────────────────────────────────────────────────────

const getFriends = async (userId, query, currentUserId) => {
  const target = await User.findById(userId);
  if (!target) throw { status: 404, message: 'Người dùng không tồn tại' };

  const { page, limit, skip } = getPaginationParams(query);

  const [friendships, total] = await Promise.all([
    Friendship.find({ users: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('users', 'username fullName avatar isVerified'),
    Friendship.countDocuments({ users: userId })
  ]);

  // Determine mutual friendship with currentUser
  let myFriendSet = new Set();
  if (currentUserId) {
    const myFriendIds = await getMyFriendIds(currentUserId);
    myFriendSet = new Set(myFriendIds.map((id) => id.toString()));
  }

  const friends = friendships.map((f) => {
    const friend = f.users.find((u) => u._id.toString() !== userId.toString());
    return {
      ...friend.toObject(),
      isFriend: myFriendSet.has(friend._id.toString()),
      friendSince: f.createdAt
    };
  });

  return { friends, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Friend Requests ──────────────────────────────────────────────────────────

const getFriendRequests = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [requests, total] = await Promise.all([
    FriendRequest.find({ receiver: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username fullName avatar isVerified'),
    FriendRequest.countDocuments({ receiver: userId, status: 'pending' })
  ]);

  return { requests, pagination: buildPaginationMeta(total, page, limit) };
};

const getSentRequests = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [requests, total] = await Promise.all([
    FriendRequest.find({ sender: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('receiver', 'username fullName avatar isVerified'),
    FriendRequest.countDocuments({ sender: userId, status: 'pending' })
  ]);

  return { requests, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Send Request ─────────────────────────────────────────────────────────────

const sendFriendRequest = async (senderId, receiverId) => {
  if (senderId.toString() === receiverId.toString()) {
    throw { status: 400, message: 'Không thể gửi lời mời kết bạn cho chính mình' };
  }

  const receiver = await User.findById(receiverId);
  if (!receiver || receiver.isBanned) throw { status: 404, message: 'Người dùng không tồn tại' };

  // Already friends?
  const existingFriendship = await Friendship.findOne({ users: { $all: [senderId, receiverId] } });
  if (existingFriendship) throw { status: 400, message: 'Hai người đã là bạn bè' };

  // Pending request exists (either direction)?
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ],
    status: 'pending'
  });
  if (existingRequest) {
    // If they sent a request to us → auto-accept
    if (existingRequest.sender.toString() === receiverId.toString()) {
      return acceptFriendRequest(existingRequest._id, senderId);
    }
    throw { status: 400, message: 'Đã gửi lời mời kết bạn rồi' };
  }

  const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });

  createNotification({
    recipient: receiverId,
    sender: senderId,
    type: 'friend_request',
    targetId: request._id,
    targetType: 'conversation'
  }).catch(() => {});

  return request.populate('receiver', 'username fullName avatar');
};

// ─── Accept Request ───────────────────────────────────────────────────────────

const acceptFriendRequest = async (requestId, userId) => {
  const request = await FriendRequest.findById(requestId);
  if (!request || request.status !== 'pending') {
    throw { status: 404, message: 'Lời mời kết bạn không tồn tại' };
  }
  if (request.receiver.toString() !== userId.toString()) {
    throw { status: 403, message: 'Không có quyền chấp nhận lời mời này' };
  }

  request.status = 'accepted';
  await request.save();

  await Friendship.create({ users: [request.sender, request.receiver] });

  createNotification({
    recipient: request.sender,
    sender: userId,
    type: 'friend_accept',
    targetId: request._id,
    targetType: 'conversation'
  }).catch(() => {});

  return { message: 'Đã chấp nhận lời mời kết bạn' };
};

// ─── Decline Request ──────────────────────────────────────────────────────────

const declineFriendRequest = async (requestId, userId) => {
  const request = await FriendRequest.findById(requestId);
  if (!request || request.status !== 'pending') {
    throw { status: 404, message: 'Lời mời kết bạn không tồn tại' };
  }
  if (request.receiver.toString() !== userId.toString()) {
    throw { status: 403, message: 'Không có quyền từ chối lời mời này' };
  }

  request.status = 'rejected';
  await request.save();

  return { message: 'Đã từ chối lời mời kết bạn' };
};

// ─── Cancel Request ───────────────────────────────────────────────────────────

const cancelFriendRequest = async (requestId, userId) => {
  const request = await FriendRequest.findById(requestId);
  if (!request || request.status !== 'pending') {
    throw { status: 404, message: 'Lời mời kết bạn không tồn tại' };
  }
  if (request.sender.toString() !== userId.toString()) {
    throw { status: 403, message: 'Không có quyền thu hồi lời mời này' };
  }

  await request.deleteOne();
  return { message: 'Đã thu hồi lời mời kết bạn' };
};

// ─── Remove Friend ────────────────────────────────────────────────────────────

const removeFriend = async (userId, friendId) => {
  const friendship = await Friendship.findOne({ users: { $all: [userId, friendId] } });
  if (!friendship) throw { status: 404, message: 'Không tìm thấy quan hệ bạn bè' };

  await Promise.all([
    friendship.deleteOne(),
    // Clean up accepted request record
    FriendRequest.deleteOne({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    })
  ]);

  return { message: 'Đã hủy kết bạn' };
};

// ─── Suggestions ──────────────────────────────────────────────────────────────

const getFriendSuggestions = async (userId, limit = 10) => {
  const [myFriendIds, pendingIds] = await Promise.all([
    getMyFriendIds(userId),
    getMyPendingIds(userId)
  ]);

  const excludedSet = new Set([
    userId.toString(),
    ...myFriendIds.map((id) => id.toString()),
    ...pendingIds
  ]);

  // Friends-of-friends: find users in my friends' friend lists
  let suggestions = [];

  if (myFriendIds.length) {
    const fofFriendships = await Friendship.find({
      users: { $in: myFriendIds }
    }).select('users');

    // Count mutual friends per candidate
    const mutualCount = {};
    fofFriendships.forEach((f) => {
      f.users.forEach((uid) => {
        const key = uid.toString();
        if (!excludedSet.has(key)) {
          mutualCount[key] = (mutualCount[key] || 0) + 1;
        }
      });
    });

    const sortedIds = Object.entries(mutualCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (sortedIds.length) {
      const users = await User.find({ _id: { $in: sortedIds }, isBanned: false })
        .select('username fullName avatar isVerified followerCount');

      suggestions = sortedIds
        .map((id) => {
          const u = users.find((u) => u._id.toString() === id);
          return u ? { ...u.toObject(), mutualFriends: mutualCount[id] } : null;
        })
        .filter(Boolean);
    }
  }

  // Fallback: fill with popular users if not enough
  if (suggestions.length < limit) {
    const moreExcluded = [...excludedSet, ...suggestions.map((u) => u._id.toString())];
    const more = await User.find({ _id: { $nin: moreExcluded }, isBanned: false })
      .select('username fullName avatar isVerified followerCount')
      .sort({ followerCount: -1 })
      .limit(limit - suggestions.length);

    suggestions.push(...more.map((u) => ({ ...u.toObject(), mutualFriends: 0 })));
  }

  return suggestions;
};

module.exports = {
  getFriends,
  getFriendRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendSuggestions
};

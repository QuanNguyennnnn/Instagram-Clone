const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notification.helper');

// ─── Conversations ─────────────────────────────────────────────────────────────

const getConversations = async (userId) => {
  const conversations = await Conversation.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .populate('participants', 'username fullName avatar isVerified')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } });

  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        seenBy: { $ne: userId }
      });

      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return { ...conv.toObject(), otherParticipant, unreadCount };
    })
  );

  return { conversations: enriched };
};

const getOrCreateConversation = async (userId, targetUserId) => {
  if (userId.toString() === targetUserId.toString()) {
    throw { status: 400, message: 'Không thể tạo cuộc trò chuyện với chính mình' };
  }

  const target = await User.findById(targetUserId);
  if (!target || target.isBanned) throw { status: 404, message: 'Người dùng không tồn tại' };

  // Tìm conversation đã có giữa 2 người
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, targetUserId], $size: 2 }
  }).populate('participants', 'username fullName avatar isVerified');

  if (!conversation) {
    conversation = await Conversation.create({ participants: [userId, targetUserId] });
    await conversation.populate('participants', 'username fullName avatar isVerified');
  }

  return { conversation };
};

// ─── Messages ─────────────────────────────────────────────────────────────────

const getMessages = async (conversationId, userId, query) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw { status: 404, message: 'Cuộc trò chuyện không tồn tại' };

  const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
  if (!isParticipant) throw { status: 403, message: 'Không có quyền truy cập' };

  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  const cursor = query.cursor || null;

  const filter = { conversation: conversationId };
  if (cursor) filter._id = { $lt: cursor };

  const messages = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .populate('sender', 'username fullName avatar');

  // Đánh dấu đã đọc các message của người kia
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, seenBy: { $ne: userId } },
    { $addToSet: { seenBy: userId } }
  );

  const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;

  // Trả về theo thứ tự cũ → mới
  return { messages: messages.reverse(), nextCursor, hasMore: !!nextCursor };
};

// ─── Send Message (REST fallback) ─────────────────────────────────────────────

const sendMessage = async (conversationId, userId, { content }) => {
  if (!content?.trim()) throw { status: 400, message: 'Nội dung tin nhắn không được để trống' };

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw { status: 404, message: 'Cuộc trò chuyện không tồn tại' };

  const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
  if (!isParticipant) throw { status: 403, message: 'Không có quyền truy cập' };

  const message = await Message.create({
    conversation: conversationId,
    sender: userId,
    content: content.trim(),
    seenBy: [userId]
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    updatedAt: new Date()
  });

  await message.populate('sender', 'username fullName avatar');

  // Emit socket event đến tất cả participant trong room
  try {
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.to(`conv:${conversationId}`).emit('new-message', { message, conversationId });
  } catch {}

  // Notify các participant khác
  const otherParticipants = conversation.participants.filter(
    (p) => p.toString() !== userId.toString()
  );
  otherParticipants.forEach((recipientId) => {
    createNotification({
      recipient: recipientId,
      sender: userId,
      type: 'message',
      targetId: conversation._id,
      targetType: 'conversation'
    }).catch(() => {});
  });

  return { message };
};

// ─── Mark Read ─────────────────────────────────────────────────────────────────

const markConversationRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw { status: 404, message: 'Cuộc trò chuyện không tồn tại' };

  const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
  if (!isParticipant) throw { status: 403, message: 'Không có quyền truy cập' };

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, seenBy: { $ne: userId } },
    { $addToSet: { seenBy: userId } }
  );

  // Thông báo cho người kia biết
  try {
    const { getIO } = require('../config/socket');
    getIO().to(`conv:${conversationId}`).emit('message-read', { conversationId, userId });
  } catch {}
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead
};

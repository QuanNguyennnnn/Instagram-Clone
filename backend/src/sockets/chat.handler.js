const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { createNotification } = require('../utils/notification.helper');

module.exports = (io, socket) => {
  const userId = socket.user._id.toString();

  // Join conversation room để nhận messages realtime
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conv:${conversationId}`);
  });

  // Typing indicators
  socket.on('typing', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user-typing', {
      userId,
      username: socket.user.username,
      conversationId
    });
  });

  socket.on('stop-typing', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user-stop-typing', {
      userId,
      conversationId
    });
  });

  // Gửi tin nhắn qua socket (realtime path)
  socket.on('send-message', async ({ conversationId, content }) => {
    try {
      if (!content?.trim() || !conversationId) return;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      // Kiểm tra user có trong conversation không
      const isParticipant = conversation.participants.some((p) => p.toString() === userId);
      if (!isParticipant) return;

      const message = await Message.create({
        conversation: conversationId,
        sender: socket.user._id,
        content: content.trim(),
        seenBy: [socket.user._id]
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });

      const populated = await message.populate('sender', 'username fullName avatar');

      // Gửi đến tất cả trong room (kể cả sender để confirm)
      io.to(`conv:${conversationId}`).emit('new-message', {
        message: populated,
        conversationId
      });

      // Notify các participant không online trong room
      const otherParticipants = conversation.participants.filter(
        (p) => p.toString() !== userId
      );

      otherParticipants.forEach((recipientId) => {
        createNotification({
          recipient: recipientId,
          sender: socket.user._id,
          type: 'message',
          targetId: conversation._id,
          targetType: 'conversation'
        }).catch(() => {});
      });
    } catch {
      socket.emit('error', { message: 'Gửi tin nhắn thất bại' });
    }
  });

  // Đánh dấu đã đọc
  socket.on('mark-read', async ({ conversationId }) => {
    try {
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          seenBy: { $ne: socket.user._id }
        },
        { $addToSet: { seenBy: socket.user._id } }
      );

      // Thông báo cho người kia biết tin nhắn đã đọc
      socket.to(`conv:${conversationId}`).emit('message-read', {
        conversationId,
        userId
      });
    } catch {}
  });
};

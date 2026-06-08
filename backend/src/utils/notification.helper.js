const Notification = require('../models/Notification');

/**
 * Tạo notification trong DB và emit realtime qua Socket.io.
 * getIO() được gọi lazy để tránh circular dependency khi module load.
 */
const createNotification = async ({ recipient, sender, type, targetId, targetType }) => {
  if (recipient.toString() === sender.toString()) return null;

  const notification = await Notification.create({ recipient, sender, type, targetId, targetType });

  // Populate sender info trước khi emit
  await notification.populate('sender', 'username fullName avatar');

  try {
    const { getIO } = require('../config/socket');
    getIO().to(`user:${recipient.toString()}`).emit('notification', notification);
  } catch {
    // Socket chưa init hoặc recipient offline — không cần xử lý
  }

  return notification;
};

module.exports = { createNotification };

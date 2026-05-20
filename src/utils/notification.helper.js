const Notification = require('../models/Notification');

/**
 * Tạo notification trong DB.
 * Socket.io real-time delivery sẽ được hook vào đây khi implement notification module.
 */
const createNotification = async ({ recipient, sender, type, targetId, targetType }) => {
  // Không tự thông báo cho chính mình
  if (recipient.toString() === sender.toString()) return null;

  const notification = await Notification.create({ recipient, sender, type, targetId, targetType });
  return notification;
};

module.exports = { createNotification };

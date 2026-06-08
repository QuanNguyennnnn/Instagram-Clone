const Notification = require('../models/Notification');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

const getNotifications = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username fullName avatar'),
    Notification.countDocuments({ recipient: userId })
  ]);

  return { notifications, pagination: buildPaginationMeta(total, page, limit) };
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  return { count };
};

const markRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw { status: 404, message: 'Thông báo không tồn tại' };
  return notification;
};

const markAllRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };

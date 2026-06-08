const notificationService = require('../services/notification.service');
const { success, error } = require('../utils/response');

const getNotifications = async (req, res) => {
  try {
    const data = await notificationService.getNotifications(req.user._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const data = await notificationService.getUnreadCount(req.user._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const markRead = async (req, res) => {
  try {
    await notificationService.markRead(req.params.id, req.user._id);
    return success(res, null, 'Đã đánh dấu đã đọc');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const markAllRead = async (req, res) => {
  try {
    await notificationService.markAllRead(req.user._id);
    return success(res, null, 'Đã đánh dấu tất cả đã đọc');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };

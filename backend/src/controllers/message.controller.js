const messageService = require('../services/message.service');
const { success, error } = require('../utils/response');

const getConversations = async (req, res) => {
  try {
    const data = await messageService.getConversations(req.user._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getOrCreateConversation = async (req, res) => {
  try {
    const data = await messageService.getOrCreateConversation(req.user._id, req.params.userId);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const getMessages = async (req, res) => {
  try {
    const data = await messageService.getMessages(req.params.conversationId, req.user._id, req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const sendMessage = async (req, res) => {
  try {
    const data = await messageService.sendMessage(req.params.conversationId, req.user._id, req.body);
    return success(res, data, 'Đã gửi tin nhắn', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const markConversationRead = async (req, res) => {
  try {
    await messageService.markConversationRead(req.params.conversationId, req.user._id);
    return success(res, null, 'Đã đánh dấu đã đọc');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = { getConversations, getOrCreateConversation, getMessages, sendMessage, markConversationRead };

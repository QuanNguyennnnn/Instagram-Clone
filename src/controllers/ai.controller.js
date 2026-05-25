const aiService = require('../services/ai.service');
const { success, error } = require('../utils/response');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const generateCaption = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Vui lòng upload ảnh', 400);

    const mimeType = req.file.mimetype;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      return error(res, 'Chỉ chấp nhận ảnh JPEG, PNG, WEBP', 400);
    }

    const result = await aiService.generateCaption(req.file.buffer, mimeType);
    return success(res, result, 'Đã tạo caption thành công');
  } catch (err) {
    return error(res, err.message || 'AI service lỗi', err.status || 500);
  }
};

const generateSmartReply = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return error(res, 'Cuộc trò chuyện không tồn tại', 404);

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return error(res, 'Không có quyền truy cập', 403);

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender', 'username');

    const formatted = messages.reverse().map((m) => ({
      senderName: m.sender.username,
      content: m.content
    }));

    if (!formatted.length) return error(res, 'Chưa có tin nhắn trong cuộc trò chuyện', 400);

    const result = await aiService.generateSmartReply(formatted);
    return success(res, result, 'Đã tạo gợi ý trả lời');
  } catch (err) {
    return error(res, err.message || 'AI service lỗi', err.status || 500);
  }
};

module.exports = { generateCaption, generateSmartReply };

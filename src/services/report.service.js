const Report = require('../models/Report');

const VALID_REASONS = ['spam', 'hate_speech', 'violence', 'nudity', 'misinformation', 'harassment', 'other'];

const createReport = async (reporterId, { targetId, targetType, reason, description = '' }) => {
  if (!VALID_REASONS.includes(reason)) {
    throw { status: 400, message: 'Lý do báo cáo không hợp lệ' };
  }

  // Mỗi user chỉ báo cáo 1 target 1 lần
  const existing = await Report.findOne({ reporter: reporterId, targetId, targetType });
  if (existing) throw { status: 409, message: 'Bạn đã báo cáo nội dung này rồi' };

  const report = await Report.create({ reporter: reporterId, targetId, targetType, reason, description });
  return report;
};

module.exports = { createReport };

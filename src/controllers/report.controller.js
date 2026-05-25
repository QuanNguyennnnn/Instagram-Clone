const reportService = require('../services/report.service');
const { success, error } = require('../utils/response');

const createReport = async (req, res) => {
  try {
    const report = await reportService.createReport(req.user._id, req.body);
    return success(res, { report }, 'Đã gửi báo cáo thành công', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = { createReport };

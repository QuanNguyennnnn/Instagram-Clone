const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) throw { status: 503, message: 'AI service chưa được cấu hình' };
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// ─── AI Caption Generator ─────────────────────────────────────────────────────

const generateCaption = async (imageBuffer, mimeType = 'image/jpeg') => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Bạn là một chuyên gia mạng xã hội. Hãy phân tích hình ảnh này và tạo ra:
1. 3 caption hấp dẫn cho Instagram (mỗi caption 1-3 câu, phong cách khác nhau: casual, inspirational, funny)
2. 10 hashtag phù hợp (không có dấu #, viết thường, liên quan đến nội dung)

Trả lời theo định dạng JSON sau (không thêm text ngoài JSON):
{
  "captions": ["caption 1", "caption 2", "caption 3"],
  "hashtags": ["tag1", "tag2", ...]
}`;

  const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType } };

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text().trim();

  // Tách JSON ra khỏi markdown code block nếu có
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw { status: 500, message: 'AI trả về định dạng không hợp lệ' };

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed.captions) || !Array.isArray(parsed.hashtags)) {
    throw { status: 500, message: 'AI trả về dữ liệu không đúng cấu trúc' };
  }

  return {
    captions: parsed.captions.slice(0, 3),
    hashtags: parsed.hashtags.slice(0, 10).map((t) => t.toLowerCase().replace(/\s+/g, '_'))
  };
};

// ─── AI Smart Reply ───────────────────────────────────────────────────────────

const generateSmartReply = async (messages) => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Format lịch sử chat gần nhất (tối đa 5 tin)
  const history = messages
    .slice(-5)
    .map((m) => `${m.senderName}: ${m.content}`)
    .join('\n');

  const prompt = `Dưới đây là đoạn hội thoại:
${history}

Hãy gợi ý 3 câu trả lời ngắn gọn, tự nhiên bằng tiếng Việt cho tin nhắn cuối cùng.
Mỗi câu trả lời nên có phong cách khác nhau (thân thiện, hài hước, lịch sự).

Trả lời theo định dạng JSON (không thêm text ngoài JSON):
{"replies": ["reply 1", "reply 2", "reply 3"]}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw { status: 500, message: 'AI trả về định dạng không hợp lệ' };

  const parsed = JSON.parse(jsonMatch[0]);
  return { replies: (parsed.replies || []).slice(0, 3) };
};

// ─── AI Content Moderation ────────────────────────────────────────────────────

const moderateContent = async (content) => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Phân tích nội dung sau đây và đánh giá mức độ vi phạm:
"${content}"

Trả lời theo định dạng JSON (không thêm text ngoài JSON):
{
  "result": "SAFE" | "HARMFUL" | "SPAM",
  "confidence": <số từ 0.0 đến 1.0>,
  "reason": "<lý do ngắn gọn>"
}`;

  const aiResult = await model.generateContent(prompt);
  const text = aiResult.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { result: 'SAFE', confidence: 0, reason: 'Parse error' };

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    result: ['SAFE', 'HARMFUL', 'SPAM'].includes(parsed.result) ? parsed.result : 'SAFE',
    confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
    reason: parsed.reason || ''
  };
};

module.exports = { generateCaption, generateSmartReply, moderateContent };

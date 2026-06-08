const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const baseTemplate = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#E1306C,#833AB4);padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-family:cursive">Instagram</h1>
    </div>
    <div style="padding:32px">${content}</div>
    <div style="background:#f8f8f8;padding:16px;text-align:center;font-size:12px;color:#999">
      © 2025 Instagram Clone. Đây là email tự động, vui lòng không trả lời.
    </div>
  </div>`;

const sendVerificationEmail = async (email, token, username) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  await transporter.sendMail({
    from: `"Instagram Clone" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Xác thực tài khoản của bạn',
    html: baseTemplate(`
      <h2 style="color:#262626">Xin chào, ${username}!</h2>
      <p style="color:#555">Cảm ơn bạn đã đăng ký. Nhấn nút bên dưới để xác thực email:</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#E1306C;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
          Xác thực Email
        </a>
      </div>
      <p style="color:#999;font-size:13px">Link sẽ hết hạn sau <strong>24 giờ</strong>. Nếu bạn không đăng ký, hãy bỏ qua email này.</p>`)
  });
};

const sendPasswordResetEmail = async (email, token, username) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: `"Instagram Clone" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Đặt lại mật khẩu',
    html: baseTemplate(`
      <h2 style="color:#262626">Đặt lại mật khẩu</h2>
      <p style="color:#555">Xin chào <strong>${username}</strong>, bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới:</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#E1306C;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
          Đặt lại mật khẩu
        </a>
      </div>
      <p style="color:#999;font-size:13px">Link sẽ hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>`)
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

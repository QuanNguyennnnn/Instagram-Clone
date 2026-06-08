const { Queue, Worker } = require('bullmq');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const redisConfig = require('../config/redis');

let emailQueue = null;

try {
  emailQueue = new Queue('email', { connection: redisConfig });

  const emailWorker = new Worker(
    'email',
    async (job) => {
      const { type, data } = job.data;
      if (type === 'verification') await sendVerificationEmail(data.email, data.token, data.username);
      else if (type === 'password-reset') await sendPasswordResetEmail(data.email, data.token, data.username);
    },
    { connection: redisConfig, concurrency: 5 }
  );

  emailWorker.on('failed', (job, err) => console.error(`Email job ${job?.id} failed:`, err.message));
  emailWorker.on('error', (err) => console.warn('[EmailQueue] Worker error:', err.message));
  emailQueue.on('error', (err) => console.warn('[EmailQueue] Queue error:', err.message));

} catch (err) {
  console.warn('[EmailQueue] Failed to initialize:', err.message);
}

// Gửi email qua queue nếu Redis có, fallback gửi trực tiếp nếu không
const addEmailJob = async (type, data) => {
  if (emailQueue) {
    try {
      return await emailQueue.add(type, { type, data }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 }
      });
    } catch (err) {
      console.warn('[EmailQueue] Queue unavailable, sending directly:', err.message);
    }
  }

  // Direct fallback khi Redis không chạy
  try {
    if (type === 'verification') await sendVerificationEmail(data.email, data.token, data.username);
    else if (type === 'password-reset') await sendPasswordResetEmail(data.email, data.token, data.username);
    console.log(`[Email] Sent directly: ${type} to ${data.email}`);
  } catch (err) {
    console.error('[Email] Direct send failed:', err.message);
  }
};

module.exports = { emailQueue, addEmailJob };

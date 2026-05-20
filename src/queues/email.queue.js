const { Queue, Worker } = require('bullmq');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const redisConfig = require('../config/redis');

const emailQueue = new Queue('email', { connection: redisConfig });

const emailWorker = new Worker(
  'email',
  async (job) => {
    const { type, data } = job.data;
    switch (type) {
      case 'verification':
        await sendVerificationEmail(data.email, data.token, data.username);
        break;
      case 'password-reset':
        await sendPasswordResetEmail(data.email, data.token, data.username);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  },
  {
    connection: redisConfig,
    concurrency: 5
  }
);

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

const addEmailJob = (type, data) =>
  emailQueue.add(type, { type, data }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }
  });

module.exports = { emailQueue, addEmailJob };

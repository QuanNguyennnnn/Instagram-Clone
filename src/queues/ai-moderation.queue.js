const { Queue, Worker } = require('bullmq');
const redisConfig = require('../config/redis');

const moderationQueue = new Queue('ai-moderation', { connection: redisConfig });

const moderationWorker = new Worker(
  'ai-moderation',
  async (job) => {
    const { postId, content } = job.data;
    if (!content || !content.trim()) return;

    const { moderateContent } = require('../services/ai.service');
    const Post = require('../models/Post');

    const result = await moderateContent(content);

    if ((result.result === 'HARMFUL' || result.result === 'SPAM') && result.confidence >= 0.85) {
      await Post.findByIdAndUpdate(postId, { isHidden: true });
      console.log(`[AI Moderation] Post ${postId} auto-hidden — ${result.result} (${result.confidence})`);
    } else {
      console.log(`[AI Moderation] Post ${postId} — ${result.result} (${result.confidence})`);
    }
  },
  {
    connection: redisConfig,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 } // 10 jobs/phút (rate limit Gemini)
  }
);

moderationWorker.on('failed', (job, err) => {
  console.error(`[AI Moderation] Job ${job?.id} failed:`, err.message);
});

const addModerationJob = (postId, content) =>
  moderationQueue.add('moderate', { postId, content }, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 }
  });

module.exports = { moderationQueue, addModerationJob };

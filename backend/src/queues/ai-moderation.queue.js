const { Queue, Worker } = require('bullmq');
const redisConfig = require('../config/redis');

let moderationQueue = null;

try {
  moderationQueue = new Queue('ai-moderation', { connection: redisConfig });

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
      limiter: { max: 10, duration: 60000 }
    }
  );

  moderationWorker.on('failed', (job, err) => {
    console.error(`[AI Moderation] Job ${job?.id} failed:`, err.message);
  });

  moderationWorker.on('error', (err) => {
    console.warn('[AI Moderation] Worker error (Redis may be unavailable):', err.message);
  });

  moderationQueue.on('error', (err) => {
    console.warn('[AI Moderation] Queue error (Redis may be unavailable):', err.message);
  });

} catch (err) {
  console.warn('[AI Moderation] Failed to initialize (Redis not available):', err.message);
}

const addModerationJob = async (postId, content) => {
  if (!moderationQueue) {
    console.warn('[AI Moderation] Skipping moderation job — Redis not available');
    return null;
  }
  return moderationQueue.add('moderate', { postId, content }, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 }
  });
};

module.exports = { moderationQueue, addModerationJob };

const crypto = require('crypto');

class QueueService {
  generateId() {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  async addTask(queueName, task) {
    const id = this.generateId();
    const taskData = {
      ...task,
      id,
      status: 'pending',
      createdAt: new Date(),
    };

    await cache.xadd(queueName, '*', {
      id,
      ...taskData,
    });

    return id;
  }

  async getPendingTasks(queueName, count = 10) {
    const results = await cache.xreadgroup(
      'GROUP', 'consumer', queueName, 'COUNT', count, 'BLOCK', 1000
    );

    return results.map(result => ({
      id: result.id,
      ...result,
    }));
  }

  async completeTask(queueName, id, result) {
    await cache.xack('GROUP', id);

    const updateData = {
      status: 'completed',
      completedAt: new Date(),
      ...result,
    };

    await cache.xadd(`${queueName}:completed`, '*', {
      id,
      ...updateData,
    });

    await cache.expire(`${queueName}:completed`, 86400);
  }

  async failTask(queueName, id, error) {
    await cache.xack('GROUP', id);

    const updateData = {
      status: 'failed',
      failedAt: new Date(),
      error: error.message || String(error),
    };

    await cache.xadd(`${queueName}:failed`, '*', {
      id,
      ...updateData,
    });

    await cache.expire(`${queueName}:failed`, 86400);
  }

  async getTaskStatus(queueName, id) {
    const completed = await cache.xrange(`${queueName}:completed`, '-', '+', 1, {
      COUNT: 1,
    });

    if (completed.length > 0 && completed[0].id === id) {
      return completed[0];
    }

    const failed = await cache.xrange(`${queueName}:failed`, '-', '+', 1, {
      COUNT: 1,
    });

    if (failed.length > 0 && failed[0].id === id) {
      return failed[0];
    }

    return null;
  }

  async cleanOldTasks(queueName, days = 7) {
    const expireTime = days * 24 * 60 * 60;

    await cache.expire(`${queueName}:completed`, expireTime);
    await cache.expire(`${queueName}:failed`, expireTime);
  }
}

const cache = require('./cacheService');

module.exports = new QueueService();
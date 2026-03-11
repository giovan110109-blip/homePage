const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    index: true,
  },
  attempts: {
    type: Number,
    default: 1,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

loginAttemptSchema.index({ ip: 1, username: 1 }, { unique: true });

loginAttemptSchema.statics.getKey = function(ip, username) {
  return `${ip}:${username}`;
};

loginAttemptSchema.statics.checkAttempts = async function(ip, username) {
  const record = await this.findOne({ ip, username });
  
  if (!record) {
    return { locked: false, attempts: 0 };
  }
  
  if (record.lockedUntil && new Date() < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - new Date()) / 60000);
    return { locked: true, remainingMinutes, attempts: record.attempts };
  }
  
  return { locked: false, attempts: record.attempts };
};

loginAttemptSchema.statics.recordFailure = async function(ip, username, maxAttempts, lockoutTime) {
  let record = await this.findOne({ ip, username });
  
  if (!record) {
    record = new this({
      ip,
      username,
      attempts: 1,
      lockedUntil: null,
    });
  } else {
    if (record.lockedUntil && new Date() < record.lockedUntil) {
      return { locked: true, attempts: record.attempts };
    }
    
    record.attempts += 1;
    record.lockedUntil = null;
  }
  
  if (record.attempts >= maxAttempts) {
    record.lockedUntil = new Date(Date.now() + lockoutTime);
    record.attempts = 0;
  }
  
  await record.save();
  
  return {
    locked: !!record.lockedUntil,
    attempts: record.attempts,
    lockedUntil: record.lockedUntil,
  };
};

loginAttemptSchema.statics.clearAttempts = async function(ip, username) {
  await this.deleteOne({ ip, username });
};

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);

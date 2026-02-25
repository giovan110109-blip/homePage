const crypto = require('crypto');
const Token = require('../models/token');

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const issueToken = async (user, ttlMs = DEFAULT_TTL_MS) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ttlMs);

  await Token.create({
    token,
    userId: user._id || user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role || 'user',
    expiresAt
  });

  return token;
};

const verifyToken = async (token) => {
  if (!token) return null;

  const tokenDoc = await Token.findOne({ token }).lean();

  if (!tokenDoc) return null;

  if (new Date() > tokenDoc.expiresAt) {
    await Token.deleteOne({ token });
    return null;
  }

  return {
    _id: tokenDoc.userId,
    username: tokenDoc.username,
    role: tokenDoc.role,
    nickname: tokenDoc.nickname,
    avatar: tokenDoc.avatar
  };
};

const revokeToken = async (token) => {
  if (token) {
    await Token.deleteOne({ token });
  }
};

const revokeAllUserTokens = async (userId) => {
  await Token.deleteMany({ userId });
};

const cleanup = async () => {
  await Token.deleteMany({ expiresAt: { $lt: new Date() } });
};

module.exports = {
  issueToken,
  verifyToken,
  revokeToken,
  revokeAllUserTokens,
  cleanup
};

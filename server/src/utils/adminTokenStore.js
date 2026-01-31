const crypto = require('crypto');

const tokenStore = new Map();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const cleanup = () => {
  const now = Date.now();
  for (const [token, data] of tokenStore) {
    if (data.exp <= now) tokenStore.delete(token);
  }
};

const issueToken = (user, ttlMs = DEFAULT_TTL_MS) => {
  cleanup();
  const token = crypto.randomBytes(32).toString('hex');
  tokenStore.set(token, {
    user,
    exp: Date.now() + ttlMs
  });
  return token;
};

const verifyToken = (token) => {
  cleanup();
  if (!token) return null;
  const data = tokenStore.get(token);
  if (!data) return null;
  if (data.exp <= Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  return data.user;
};

const revokeToken = (token) => {
  tokenStore.delete(token);
};

module.exports = {
  issueToken,
  verifyToken,
  revokeToken,
};
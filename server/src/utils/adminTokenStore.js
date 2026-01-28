const crypto = require('crypto');

const tokenStore = new Map();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const cleanup = () => {
  const now = Date.now();
  for (const [token, exp] of tokenStore) {
    if (exp <= now) tokenStore.delete(token);
  }
};

const issueToken = (ttlMs = DEFAULT_TTL_MS) => {
  cleanup();
  const token = crypto.randomBytes(32).toString('hex');
  tokenStore.set(token, Date.now() + ttlMs);
  return token;
};

const verifyToken = (token) => {
  cleanup();
  if (!token) return false;
  const exp = tokenStore.get(token);
  if (!exp) return false;
  if (exp <= Date.now()) {
    tokenStore.delete(token);
    return false;
  }
  return true;
};

const revokeToken = (token) => {
  tokenStore.delete(token);
};

module.exports = {
  issueToken,
  verifyToken,
  revokeToken,
};
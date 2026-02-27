const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const isBcryptHash = (hash) => {
  return hash && hash.startsWith('$2b$');
};

const legacyHash = (value) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(String(value)).digest('hex');
};

const verifyPassword = async (password, hash) => {
  if (isBcryptHash(hash)) {
    return await comparePassword(password, hash);
  }
  return legacyHash(password) === hash;
};

module.exports = {
  hashPassword,
  comparePassword,
  verifyPassword,
  isBcryptHash,
  legacyHash
};

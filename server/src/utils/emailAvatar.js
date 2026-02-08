const md5 = require('md5');

/**
 * 通过邮箱获取 Gravatar 头像
 * @param {string} email
 * @param {number} size
 * @returns {string} 头像URL
 */
function getAvatarByEmail(email, size = 120) {
  const lowerEmail = email.trim().toLowerCase();
  // QQ邮箱特殊处理
  if (lowerEmail.endsWith('@qq.com')) {
    const qq = lowerEmail.split('@')[0];
    return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=640`;
  }
  // 其他邮箱用 Gravatar
  const md5 = require('md5');
  const hash = md5(lowerEmail);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

module.exports = {
  getAvatarByEmail,
};
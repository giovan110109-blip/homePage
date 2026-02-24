const md5 = require('md5');

/**
 * 通过邮箱获取头像
 * 只有提供公开头像 API 的服务商才返回头像 URL，否则返回 null
 * @param {string} email
 * @param {number} size
 * @returns {string|null} 头像URL 或 null（无公开API时）
 */
function getAvatarByEmail(email, size = 120) {
  if (!email) {
    return null;
  }
  
  const lowerEmail = email.trim().toLowerCase();
  
  // QQ邮箱 - 使用QQ头像 (腾讯公开API)
  if (lowerEmail.endsWith('@qq.com')) {
    const qq = lowerEmail.split('@')[0];
    return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=640`;
  }
  
  // Foxmail - 使用QQ头像 (腾讯公开API)
  if (lowerEmail.endsWith('@foxmail.com')) {
    const username = lowerEmail.split('@')[0];
    return `https://q1.qlogo.cn/g?b=qq&nk=${username}&s=640`;
  }
  
  // 新浪邮箱 - 新浪有公开头像服务
  if (lowerEmail.endsWith('@sina.com') || lowerEmail.endsWith('@sina.cn')) {
    const username = lowerEmail.split('@')[0];
    return `https://portrait.sinaimg.cn/${username}`;
  }
  
  // 其他所有邮箱 - 没有公开的头像 API，返回 null
  // 包括: 163, 126, yeah.net, gmail, outlook, hotmail, 139, 189, icloud 等
  return null;
}

/**
 * 检查邮箱是否有效
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 获取邮箱域名
 */
function getEmailDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase();
}

/**
 * 获取邮箱服务商名称
 */
function getEmailProviderName(email) {
  const domain = getEmailDomain(email);
  if (!domain) return '未知';
  
  const providerMap = {
    'qq.com': 'QQ邮箱',
    'foxmail.com': 'Foxmail',
    '163.com': '163邮箱',
    '126.com': '126邮箱',
    'yeah.net': '网易邮箱',
    'gmail.com': 'Gmail',
    'outlook.com': 'Outlook',
    'hotmail.com': 'Hotmail',
    'live.com': 'Live',
    'msn.com': 'MSN',
    'sina.com': '新浪邮箱',
    'sina.cn': '新浪邮箱',
    'sohu.com': '搜狐邮箱',
    '139.com': '139邮箱',
    '189.cn': '189邮箱',
    'icloud.com': 'iCloud',
    'me.com': 'Me',
    'yahoo.com': 'Yahoo',
    'yahoo.com.cn': '雅虎中国',
    'yahoo.cn': '雅虎中国',
    'aliyun.com': '阿里云邮箱',
  };
  
  return providerMap[domain] || domain;
}

module.exports = {
  getAvatarByEmail,
  isValidEmail,
  getEmailDomain,
  getEmailProviderName
};

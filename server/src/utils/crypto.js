/**
 * 密码加密解密工具
 */

/**
 * 解密前端发来的密码
 * @param encrypted 加密的密码 (base64格式)
 * @returns 原始密码
 */
function decryptPassword(encrypted) {
  try {
    if (!encrypted || typeof encrypted !== 'string') {
      return encrypted
    }
    
    const decoded = Buffer.from(encrypted, 'base64').toString('utf-8')
    return decoded
  } catch (e) {
    // 如果解密失败，返回原始值
    return encrypted
  }
}

module.exports = {
  decryptPassword
}

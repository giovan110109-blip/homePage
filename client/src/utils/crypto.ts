/**
 * 简单的密码加密工具
 * 前端加密 + 后端 hash，增强密码安全性
 */

/**
 * 对密码进行加密
 * @param password 原始密码
 * @returns 加密后的密码
 */
export function encryptPassword(password: string): string {
  if (!password) return ''
  
  // 使用 base64 编码，防止密码在前端以明文传输
  return btoa(password)
}

/**
 * 对密码进行解密
 * @param encrypted 加密后的密码
 * @returns 原始密码
 */
export function decryptPassword(encrypted: string): string {
  try {
    if (!encrypted || typeof encrypted !== 'string') {
      return encrypted
    }
    return atob(encrypted)
  } catch (e) {
    return encrypted
  }
}

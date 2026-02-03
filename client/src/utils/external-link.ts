/**
 * 外部链接处理工具
 */

/**
 * 判断是否为外部链接
 * @param url 链接地址
 * @returns 是否为外部链接
 */
export function isExternalLink(url: string): boolean {
  if (!url) return false
  
  // 如果是相对路径或以 / 开头，不是外部链接
  if (url.startsWith('/') || url.startsWith('#')) {
    return false
  }
  
  // 检查是否包含协议
  if (!url.includes('://')) {
    return false
  }
  
  // 检查是否为当前域名
  try {
    const urlObj = new URL(url)
    const currentHost = window.location.host
    return urlObj.host !== currentHost
  } catch (e) {
    return false
  }
}

/**
 * 生成跳转确认页面的 URL
 * @param targetUrl 目标URL
 * @returns 跳转确认页面的路由路径
 */
export function getExternalLinkRedirectUrl(targetUrl: string): string {
  const encodedUrl = encodeURIComponent(targetUrl)
  return `/#/go?url=${encodedUrl}`
}

/**
 * 处理链接点击事件
 * @param url 链接地址
 * @param event 点击事件
 */
export function handleLinkClick(url: string, event?: MouseEvent) {
  if (!url) return
  
  // 如果是外部链接，跳转到确认页面
  if (isExternalLink(url)) {
    if (event) {
      event.preventDefault()
    }
    const redirectUrl = getExternalLinkRedirectUrl(url)
    window.location.href = redirectUrl
  } else {
    // 内部链接直接跳转
    if (event) {
      event.preventDefault()
    }
    window.location.href = url
  }
}

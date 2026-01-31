/**
 * 环境相关工具函数
 */

/**
 * 判断是否为本地开发环境
 * @returns {boolean} 是否为本地环境
 */
export const isLocalEnvironment = (): boolean => {
  return import.meta.env.DEV
}

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
export const getBaseURL = (): string => {
  // 如果是本地环境
  if (isLocalEnvironment()) {
    // 开发环境使用配置的代理或直接指定本地端口
    return import.meta.env.VITE_API_BASE_URL_LOCAL 
  }
  
  // 生产环境，可以使用相对路径或完整域名
  return import.meta.env.VITE_API_BASE_URL 
}

/**
 * 获取完整的资源URL
 * @param {string} path - 资源路径
 * @returns {string} 完整的资源URL
 */
export const getAssetURL = (path: string): string => {
  if (!path) return ''
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // 拼接baseURL
  const baseURL = getBaseURL()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  return `${baseURL}${normalizedPath}`
}

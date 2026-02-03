/**
 * 照片相关工具函数
 */

/**
 * 获取带缓存破坏参数的照片 URL
 * @param photo 照片对象
 * @param urlField URL 字段名，默认为 'originalUrl'
 * @returns 带时间戳的 URL
 */
export function getPhotoUrl(photo: any, urlField: string = 'originalUrl'): string {
  if (!photo) return ''
  
  const url = photo[urlField]
  if (!url) return ''
  
  // 如果有 updatedAt，使用它作为缓存破坏参数
  const timestamp = photo.updatedAt ? new Date(photo.updatedAt).getTime() : ''
  
  return timestamp ? `${url}?t=${timestamp}` : url
}

/**
 * 获取照片的原始 URL（WebP 缩略图）
 */
export function getPhotoOriginalUrl(photo: any): string {
  return getPhotoUrl(photo, 'originalUrl')
}

/**
 * 获取照片的高分辨率原始文件 URL
 */
export function getPhotoOriginalFileUrl(photo: any): string {
  return getPhotoUrl(photo, 'originalFileUrl')
}

/**
 * 获取照片的缩略图 URL
 */
export function getPhotoThumbnailUrl(photo: any): string {
  return getPhotoUrl(photo, 'thumbnailUrl')
}

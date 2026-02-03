/**
 * 从 URL 加载图片
 */
const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

/**
 * 旋转图片并转换为 Blob
 * @param url 图片 URL
 * @param degree 旋转角度 (90, -90, 180 等)
 */
export const rotateImage = async (url: string, degree: number): Promise<Blob> => {
  const img = await loadImageFromUrl(url)
  
  // 根据旋转角度调整 canvas 尺寸
  const isSwap = Math.abs(degree) === 90 || Math.abs(degree) === 270
  const canvas = document.createElement('canvas')
  canvas.width = isSwap ? img.height : img.width
  canvas.height = isSwap ? img.width : img.height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取 Canvas 上下文')
  
  // 转换坐标系统并绘制
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((degree * Math.PI) / 180)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('无法生成图片'))
      } else {
        resolve(blob)
      }
    }, 'image/jpeg', 0.95)
  })
}

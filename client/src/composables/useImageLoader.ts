import { ref, readonly } from 'vue'
import { imageLoaderManager, type ImageLoaderState, type ImageLoaderCallbacks } from '@/utils/image-loader'

export const useImageLoader = () => {
  const loadingState = ref<ImageLoaderState>({
    isVisible: false,
  })

  const isLoading = readonly(ref(loadingState.value.isVisible))

  /**
   * 加载图片
   */
  const loadImage = async (src: string, callbacks?: ImageLoaderCallbacks) => {
    try {
      const result = await imageLoaderManager.loadImage(src, {
        ...callbacks,
        onUpdateLoadingState: (state) => {
          loadingState.value = { ...loadingState.value, ...state }
          callbacks?.onUpdateLoadingState?.(state)
        },
      })

      console.log(`✅ 图片加载完成: ${src} (${(result.size / 1024 / 1024).toFixed(2)}MB)`)
      return result
    } catch (error) {
      console.error(`❌ 加载图片失败: ${src}`, error)
      throw error
    }
  }

  /**
   * 获取缓存统计
   */
  const getCacheStats = () => {
    return imageLoaderManager.getCacheStats()
  }

  /**
   * 清空缓存
   */
  const clearCache = () => {
    imageLoaderManager.clearCache()
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    imageLoaderManager.cleanup()
  }

  return {
    loadingState: readonly(loadingState),
    isLoading,
    loadImage,
    getCacheStats,
    clearCache,
    cleanup,
  }
}

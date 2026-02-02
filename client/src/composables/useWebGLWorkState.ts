import { LoadingState } from '@decanter/webgl-image'

export const useWebGLWorkState = (
  loadingIndicatorRef: any | null,
) => {

  return (
    isLoading: boolean,
    state?: LoadingState,
    quality?: 'high' | 'medium' | 'low' | 'unknown',
  ) => {
    let message = ''

    if (state === LoadingState.TEXTURE_LOADING) {
      message = '正在构建纹理'
    } else if (state === LoadingState.IMAGE_LOADING) {
      message = '正在加载图片'
    }

    loadingIndicatorRef?.updateLoadingState({
      isVisible: isLoading,
      isWebGLLoading: isLoading,
      webglMessage: message,
      webglQuality: quality,
    })
  }
}

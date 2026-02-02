<script setup lang="ts">
import { WebGLImageViewer } from "@decanter/webgl-image";
import { useImageLoader } from "@/composables/useImageLoader";
import { useWebGLWorkState } from "@/composables/useWebGLWorkState";

interface Props {
  src: string;
  highResSrc?: string;  // 高分辨率原始文件URL（如果有）
  thumbhash?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  enablePan?: boolean;
  enableZoom?: boolean;
  isCurrentImage?: boolean;
  loadingIndicatorRef: any | null;
  onProgress?: (progress: number) => void;
  onError?: () => void;
  onZoomChange?: (isZoomed: boolean, level?: number) => void;
  onBlobSrcChange?: (blobSrc: string | null) => void;
  onImageLoaded?: () => void;
  isLivePhoto?: boolean;
  livePhotoVideoUrl?: string;
  isHDR?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enablePan: true,
  enableZoom: true,
  isCurrentImage: true,
  thumbhash: null,
  highResSrc: undefined,
  alt: "Image",
  width: undefined,
  height: undefined,
  className: "",
  onProgress: undefined,
  onError: undefined,
  onZoomChange: undefined,
  onBlobSrcChange: undefined,
  onImageLoaded: undefined,
  isLivePhoto: false,
  livePhotoVideoUrl: "",
  isHDR: false,
});

const containerRef = ref<HTMLDivElement>();

const highResLoaded = ref(false);
const highResRendered = ref(false);
const hasError = ref(false);
const currentSrc = ref<string | null>();

// 使用 WebGLImageViewer 的引用
const webglViewerRef = ref();

const showThumbnail = computed(() => {
  return props.thumbhash && (!highResRendered.value || hasError.value)
})


const showWebGLViewer = computed(() => {
  return (
    highResLoaded.value &&
    currentSrc.value &&
    props.isCurrentImage &&
    !hasError.value
  );
});

const { loadImage, cleanup } = useImageLoader();

const loadHighResImage = async () => {
  if (highResLoaded.value || !props.isCurrentImage || hasError.value) return;
  try {
    // 优先使用 highResSrc（原始文件），如果没有则使用 src（WebP缩略图）
    const sourceUrl = props.highResSrc || props.src;
    console.log("Loading image from:", sourceUrl);
    
    const result = await loadImage(sourceUrl, {
      onProgress: props.onProgress,
      onError: () => {
        props.onError?.();
      },
      onUpdateLoadingState: (state) => {
        props.loadingIndicatorRef?.updateLoadingState(state);
      },
    });

    currentSrc.value = result.blobSrc;
    highResLoaded.value = true;
    highResRendered.value = true;  // 标记为已渲染，隐藏 ThumbHash
    hasError.value = false;
    props.onBlobSrcChange?.(result.blobSrc);
    props.onImageLoaded?.();
  } catch {
    hasError.value = true;
    props.onError?.();
    props.loadingIndicatorRef?.updateLoadingState({
      isVisible: true,
      isError: true,
      message: "载入图片失败",
    });
  }
};

// 监听 isCurrentImage 的变化，当变为 true 时触发图片加载
watch(
  () => props.isCurrentImage,
  (isCurrent, wasCurrent) => {
    if (!isCurrent && wasCurrent) {
      // 当图片不再是当前图片时，中断加载
      cleanup();
    } else if (
      isCurrent &&
      !wasCurrent &&
      !highResLoaded.value &&
      !hasError.value
    ) {
      // 当图片变为当前图片且尚未加载高分辨率图片时，触发加载
      loadHighResImage();
    }
  },
  { immediate: false },
);

// 监听 src 的变化，当源地址改变时重置状态并重新加载
watch(
  () => props.src,
  (newSrc, oldSrc) => {
    if (newSrc !== oldSrc) {
      // 中断之前的加载
      cleanup();

      // 重置状态
      highResLoaded.value = false;
      highResRendered.value = false;
      hasError.value = false;
      currentSrc.value = null;

      // 如果是当前图片，立即开始加载
      if (props.isCurrentImage) {
        loadHighResImage();
      }
    }
  },
  { immediate: false },
);

// 监听 highResSrc 的变化（高分辨率原始文件URL）
watch(
  () => props.highResSrc,
  (newHighResSrc, oldHighResSrc) => {
    if (newHighResSrc !== oldHighResSrc && props.isCurrentImage) {
      // 重新加载（使用新的highResSrc）
      cleanup();
      highResLoaded.value = false;
      hasError.value = false;
      currentSrc.value = null;
      loadHighResImage();
    }
  },
  { immediate: false },
);

// 初始加载
loadHighResImage();

const handleWebGLStateChange = useWebGLWorkState(props.loadingIndicatorRef);

// 处理缩放状态变化
const handleZoomChange = (originalScale: number, relativeScale: number) => {
  const isZoomed = relativeScale > 1.1; // 认为缩放超过 1.1 倍算作缩放状态
  if (props.onZoomChange) {
    props.onZoomChange(isZoomed, Math.round(originalScale * 10) / 10); // 传递绝对倍率并保留一位小数
  }
};

// 组件卸载时清理
onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full flex items-center justify-center"
  >
    <ThumbHash
      v-if="showThumbnail"
      :thumbhash="thumbhash"
      class="absolute inset-0 w-full h-full object-contain"
      thumbhash-class="opacity-50"
      image-contain
    />

    <!-- WebGL 图片查看器 -->
    <WebGLImageViewer
      v-if="showWebGLViewer"
      ref="webglViewerRef"
      :src="currentSrc!"
      :class="className"
      class="w-full h-full"
      :width="width"
      :height="height"
      :center-on-init="true"
      :limit-to-bounds="true"
      :smooth="true"
      :min-scale="1"
      :max-scale="12"
      :wheel="{ step: 0.2, wheelDisabled: false, touchPadDisabled: false }"
      :pinch="{ step: 0.2 }"
      :double-click="{ mode: 'toggle', step: 2.4, animationTime: 400 }"
      :panning="{ velocityDisabled: false }"
      @zoom-change="handleZoomChange"
      @loading-state-change="handleWebGLStateChange"
    />

    <!-- 错误状态 -->
    <div
      v-if="hasError"
      class="flex flex-col items-center justify-center text-white/70 gap-2"
    >
      <Icon name="tabler:photo-off" class="w-12 h-12" />
      <p class="text-sm">图片加载失败</p>
    </div>
  </div>
</template>

<style scoped></style>

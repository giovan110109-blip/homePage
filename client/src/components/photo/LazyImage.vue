<template>
  <div
    ref="wrapper"
    class="lazy-image-wrapper"
    :style="{
      aspectRatio: `${width} / ${height}`,
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- ThumbHash 占位符 - 不淡出，保持显示 -->
    <img
      v-if="thumbHashDataUrl"
      :src="thumbHashDataUrl"
      class="lazy-image-placeholder"
      :style="{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
        filter: 'blur(12px)',
        zIndex: 1,
      }"
      decoding="async"
    />

    <!-- 占位符背景色 -->
    <div
      v-else
      :style="{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#f5f5f5',
        zIndex: 1,
      }"
    />

    <!-- 实际图片 - 仅在进入可视区域时加载 - 淡入覆盖占位符 -->
    <img
      v-if="isVisible && showImage"
      :src="imageSrc"
      class="w-full h-full group-hover:scale-105"
      :style="{
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.4s ease-in-out, transform 0.5s ease',
        zIndex: 2,
      }"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      @load="onImageLoad"
      @error="onImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { thumbHashToDataURL } from "thumbhash";
import { observeSharedVisibility } from "@/composables/useSharedVisibilityObserver";

interface Props {
  /** 图片 URL */
  src: string;
  /** ThumbHash Base64 字符串 */
  thumbHash?: string;
  /** 图片宽度（用于宽高比计算） */
  width?: number;
  /** 图片高度（用于宽高比计算） */
  height?: number;
  /** 图片 MIME 类型 */
  mimeType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: 16,
  height: 9,
  mimeType: "image/jpeg",
});
const emit = defineEmits<{
  load: [event: Event];
  error: [event: Event];
}>();

const imageLoaded = ref(false);
const thumbHashDataUrl = ref("");
const showImage = ref(false); // 控制何时开始加载实际图片
const isVisible = ref(false); // 是否在可视区域内
const wrapper = ref<HTMLDivElement>();
const imageSrc = computed(() => props.src);
let stopObserving: (() => void) | null = null;

/**
 * 生成 ThumbHash 占位符图片 URL
 */
const generateThumbHashDataUrl = () => {
  // 重置状态
  imageLoaded.value = false;
  showImage.value = false;

  if (!props.thumbHash) {
    thumbHashDataUrl.value = "";
    return;
  }

  try {
    // 从 Base64 解码
    const binaryString = atob(props.thumbHash);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    thumbHashDataUrl.value = thumbHashToDataURL(bytes);
  } catch {
    thumbHashDataUrl.value = "";
  }
};

const onImageLoad = (event: Event) => {
  // 立即标记图片已加载，触发淡入/淡出动画
  imageLoaded.value = true;
  emit("load", event);
};

const onImageError = (event: Event) => {
  showImage.value = true;
  imageLoaded.value = false;
  emit("error", event);
};

// 监听 src 和 thumbHash 变化，重新生成
watch(
  [() => props.src, () => props.thumbHash],
  () => {
    generateThumbHashDataUrl();
    showImage.value = isVisible.value && Boolean(props.src);
    imageLoaded.value = false;
  },
  { immediate: true },
);

onMounted(() => {
  if (!wrapper.value) return;

  stopObserving = observeSharedVisibility(wrapper.value, (visible) => {
    if (!visible) return;

    isVisible.value = true;
    showImage.value = Boolean(props.src);
  });
});

// 清理
onUnmounted(() => {
  if (stopObserving) {
    stopObserving();
    stopObserving = null;
  }
});
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
}

.lazy-image-placeholder {
  filter: blur(20px);
  transform: scale(1.1);
}
</style>

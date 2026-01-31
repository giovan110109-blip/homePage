<template>
  <div
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

    <!-- 实际图片 - 淡入覆盖占位符 -->
    <img
      v-if="showImage"
      :src="webpSrc"
      class="w-full h-full  group-hover:scale-105"
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
      @load="onImageLoad"
      @error="onImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { thumbHashToDataURL } from "thumbhash";

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

const imageLoaded = ref(false);
const thumbHashDataUrl = ref("");
const showImage = ref(false); // 控制何时开始加载实际图片

// 计算 WebP 版本的 URL
const webpSrc = computed(() => {
  const url = props.src;

  // 如果已经是 webp 格式，直接返回
  if (url.toLowerCase().endsWith(".webp")) {
    return url;
  }

  // 否则替换扩展名为 .webp
  const lastDot = url.lastIndexOf(".");
  if (lastDot > 0) {
    return url.substring(0, lastDot) + ".webp";
  }
  return url + ".webp";
});

/**
 * 生成 ThumbHash 占位符图片 URL
 */
const generateThumbHashDataUrl = async () => {
  // 重置状态
  imageLoaded.value = false;
  showImage.value = false;

  if (!props.thumbHash) {
    thumbHashDataUrl.value = "";
    showImage.value = true;
    return;
  }

  try {
    // 从 Base64 解码
    const binaryString = atob(props.thumbHash);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 使用 thumbhash 库的 thumbHashToDataURL 生成占位图
    thumbHashDataUrl.value = thumbHashToDataURL(bytes);

    // 等待一小段时间确保占位符渲染，然后再允许加载实际图片
    await new Promise((resolve) => setTimeout(resolve, 100));
    showImage.value = true;
  } catch (error) {
    thumbHashDataUrl.value = "";
    showImage.value = true;
  }
};

const onImageLoad = () => {
  // 立即标记图片已加载，触发淡入/淡出动画
  imageLoaded.value = true;
};

const onImageError = () => {
  showImage.value = true;
  imageLoaded.value = false;
};

// 监听 src 和 thumbHash 变化，重新生成
watch(
  [() => props.src, () => props.thumbHash],
  () => {
    generateThumbHashDataUrl();
  },
  { immediate: true },
);
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

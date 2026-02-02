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
      :src="webpSrc"
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
      decoding="async"
      @load="onImageLoad"
      @error="onImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { thumbHashToDataURL } from "thumbhash";
import { useImageLoader } from "@/composables/useImageLoader";

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

const { loadImage } = useImageLoader();
const imageLoaded = ref(false);
const thumbHashDataUrl = ref("");
const showImage = ref(false); // 控制何时开始加载实际图片
const isVisible = ref(false); // 是否在可视区域内
const cachedImageUrl = ref<string>("");
const isLoadingImage = ref(false);
const requestId = ref(0);
const wrapper = ref<HTMLDivElement>();
const intersectionObserver = ref<IntersectionObserver | null>(null);

// 计算 WebP 版本的 URL
const rawWebpUrl = computed(() => {
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

const webpSrc = computed(() => {
  return cachedImageUrl.value || rawWebpUrl.value;
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
  } catch (error) {
    thumbHashDataUrl.value = "";
  }
};

/**
 * 预加载 WebP 版本的图片到缓存
 */
const preloadWebpImage = async () => {
  if (!props.src) return;

  const currentId = ++requestId.value;
  const webpUrl = rawWebpUrl.value;

  isLoadingImage.value = true;
  try {
    const result = await loadImage(webpUrl, {
      onProgress: (progress) => {
        // console.log(`📥 图片加载进度: ${progress.toFixed(0)}%`);
      },
      onError: () => {
        console.warn(`⚠️ WebP 图片加载失败: ${webpUrl}`);
      },
    });

    if (currentId !== requestId.value) return;

    if (result.blobSrc) {
      cachedImageUrl.value = result.blobSrc;
    }
  } catch (error) {
    if (currentId !== requestId.value) return;
    console.error(`❌ 图片加载异常: ${webpUrl}`, error);
    cachedImageUrl.value = webpUrl;
  } finally {
    if (currentId !== requestId.value) return;
    isLoadingImage.value = false;
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
    cachedImageUrl.value = ""; // 清除缓存 URL
    generateThumbHashDataUrl();
    // 如果已进入可视区域，才继续加载真实图片
    if (isVisible.value) {
      showImage.value = false;
      imageLoaded.value = false;
      preloadWebpImage();
    } else {
      showImage.value = false;
      imageLoaded.value = false;
    }
  },
  { immediate: true },
);

// Intersection Observer - 监听是否进入可视区域
onMounted(() => {
  if (!wrapper.value) return;

  intersectionObserver.value = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // 进入可视区域
          isVisible.value = true;
          if (!isLoadingImage.value && !imageLoaded.value) {
            preloadWebpImage();
          }
          // 监听到了就可以停止监听了（因为图片已经加载）
          if (intersectionObserver.value) {
            intersectionObserver.value.unobserve(entry.target);
          }
        }
      }
    },
    {
      // 提前 200px 开始加载（还未完全进入视口时）
      rootMargin: "200px",
      threshold: 0,
    },
  );

  intersectionObserver.value.observe(wrapper.value);
});

// 清理
onUnmounted(() => {
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect();
    intersectionObserver.value = null;
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

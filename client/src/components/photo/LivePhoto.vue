<template>
  <div
    class="relative w-full overflow-hidden select-none outline-none focus:outline-none border-0 ring-0 group"
    :style="{ aspectRatio: `${width} / ${height}` }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- 静态图片层 - 播放时隐藏 -->
    <div
      class="absolute inset-0 w-full h-full transition-opacity duration-300"
      :class="isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      style="z-index: 1"
    >
      <LazyImage
        :src="imageUrl"
        :thumb-hash="thumbHash"
        :width="width || 1"
        :height="height || 1"
        class="w-full h-full transition-transform duration-500 group-hover:scale-100"
      />
    </div>

    <!-- 视频层 - 播放时显示，z-index 更高 -->
    <video
      ref="videoRef"
      class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none outline-none focus:outline-none border-0 ring-0"
      :class="[isPlaying ? 'opacity-100' : 'opacity-0']"
      :style="{
        zIndex: 2,
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        transform: isPlaying ? 'scale(1)' : 'scale(1)',
        border: 'none',
        outline: 'none',
      }"
      :src="cachedVideoUrl || videoUrl"
      :muted="isMuted"
      playsinline
      webkit-playsinline
      :preload="isMobile ? 'metadata' : 'none'"
      title=""
      aria-label=""
      tabindex="-1"
      controlsList="nodownload"
      disablePictureInPicture
      disableRemotePlayback
      @canplay="onVideoCanPlay"
      @loadedmetadata="onVideoLoadedMetadata"
      @timeupdate="onVideoTimeUpdate"
      @ended="handleVideoEnded"
      @error="onVideoError"
    />

    <!-- Hover 遮罩层 - -->
    <div
      class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-[3] pointer-events-none"
    />

    <!-- 指示器 - 左上角 -->
    <div
      v-if="isLive"
      class="absolute top-2 left-2 md:top-3 md:left-3 z-20 backdrop-blur-md rounded-full pl-1 pr-1.5 py-1 text-[13px] font-bold flex items-center gap-0.5 leading-0 select-none transition-colors duration-300"
      :class="
        isPlaying
          ? 'text-yellow-300 bg-yellow-300/10'
          : 'text-white bg-black/30'
      "
      :style="{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }"
    >
      <!-- Loading 图标 -->
      <svg
        v-if="!videoCanPlay"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="icon icon-tabler icons-tabler-outline icon-tabler-live-photo livephoto-spin transition-transform duration-300"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" />
        <path d="M15.9 20.11l0 .01" />
        <path d="M19.04 17.61l0 .01" />
        <path d="M20.77 14l0 .01" />
        <path d="M20.77 10l0 .01" />
        <path d="M19.04 6.39l0 .01" />
        <path d="M15.9 3.89l0 .01" />
        <path d="M12 3l0 .01" />
        <path d="M8.1 3.89l0 .01" />
        <path d="M4.96 6.39l0 .01" />
        <path d="M3.23 10l0 .01" />
        <path d="M3.23 14l0 .01" />
        <path d="M4.96 17.61l0 .01" />
        <path d="M8.1 20.11l0 .01" />
        <path d="M12 21l0 .01" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="icon icon-tabler icons-tabler-outline icon-tabler-live-photo transition-transform duration-300"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" />
        <path d="M15.9 20.11l0 .01" />
        <path d="M19.04 17.61l0 .01" />
        <path d="M20.77 14l0 .01" />
        <path d="M20.77 10l0 .01" />
        <path d="M19.04 6.39l0 .01" />
        <path d="M15.9 3.89l0 .01" />
        <path d="M12 3l0 .01" />
        <path d="M8.1 3.89l0 .01" />
        <path d="M4.96 6.39l0 .01" />
        <path d="M3.23 10l0 .01" />
        <path d="M3.23 14l0 .01" />
        <path d="M4.96 17.61l0 .01" />
        <path d="M8.1 20.11l0 .01" />
        <path d="M12 21l0 .01" />
      </svg>
      <span>LIVE</span>
    </div>

    <!-- 静音按钮  -->
    <LivePhotoMute
      class="absolute top-2 right-2 md:top-3 md:right-3 z-20 backdrop-blur-md rounded-full p-1.5 transition-all duration-300 hover:bg-white/20 active:scale-95"
      :modelValue="isMuted"
      @update:modelValue="
        (value) => {
          isMuted = value;
          if (videoRef && videoRef.muted !== value) {
            videoRef.muted = value;
          }
        }
      "
    />
  </div>
</template>

<script setup lang="ts">
import LazyImage from "./LazyImage.vue";
import { useLivePhotoCache } from "@/composables/useLivePhotoCache";

interface Props {
  imageUrl: string;
  videoUrl?: string;
  isLive?: boolean;
  thumbHash?: string;
  width?: number;
  height?: number;
  photoId?: string; // 新增：用于缓存标识
}

const props = withDefaults(defineProps<Props>(), {
  isLive: false,
  width: 1,
  height: 1,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

// LivePhoto 缓存
const { loadLivePhoto,  } = useLivePhotoCache();
const cachedVideoUrl = ref<string | null>(null);

// Refs
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const videoCanPlay = ref(false);
const isMuted = ref(true); // 默认静音

// Touch interaction state
const isTouching = ref(false);
const isHovering = ref(false);
const longPressTimer = ref<number | null>(null);

// 防止重复触发的标志
let isPlayingNow = false;

// Mobile detection - 简化版
const isMobile = computed(() => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
});

// 视频元数据加载完成
const onVideoCanPlay = () => {
  videoCanPlay.value = true;
};

const onVideoLoadedMetadata = () => {
  // 元数据可用时也视为可播放，避免移动端一直等待 canplay
  videoCanPlay.value = true;
};

// 监听视频播放进度 - 在结束前1秒回到图片
const onVideoTimeUpdate = () => {
  if (!videoRef.value || !isPlaying.value) return;

  const remaining = videoRef.value.duration - videoRef.value.currentTime;

  // 剩余时间小于1秒，立即隐藏视频
  if (remaining < 0.5 && remaining > 0) {
    isPlaying.value = false;
  }
};

// 视频加载错误
const onVideoError = (e: Event) => {
  console.error("❌ 视频加载错误", e);
  videoCanPlay.value = false;
  isPlaying.value = false;
  isPlayingNow = false;
};

// 桌面端 - 鼠标悬停播放
const handleMouseEnter = async () => {
  if (isMobile.value || !props.isLive || !props.videoUrl) return;

  // 已经在悬停状态，直接返回
  if (isHovering.value) return;

  isHovering.value = true;

  // 如果视频已经加载好，立即播放
  if (videoCanPlay.value) {
    isPlayingNow = true;
    await playVideo();
  }
};

const handleMouseLeave = (event: MouseEvent) => {
  if (isMobile.value) return;

  // 简单粗暴：直接停止播放
  // 因为 mouseleave 事件本身就表示鼠标离开了容器
  isHovering.value = false;

  // 如果正在播放，停止
  if (isPlaying.value) {
    isPlayingNow = false;
    stopVideo();
  }
};

// 移动端 - 长按触发 (350ms)
const handleTouchStart = (event: TouchEvent) => {
  if (!isMobile.value || !props.isLive || !props.videoUrl) return;

  // 已经在播放，不要重复调用
  if (isPlayingNow) return;

  // 只处理单指触摸
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    if (touch) {
      isTouching.value = true;

      // 长按定时器 (350ms)
      longPressTimer.value = window.setTimeout(() => {
        if (isTouching.value && !isPlayingNow) {
          isPlayingNow = true;
          playVideo();

          // 触觉反馈
          if ("vibrate" in navigator) {
            navigator.vibrate(50);
          }
        }
      }, 350);
    }
  }
};

const handleTouchEnd = () => {
  if (!isMobile.value) return;

  isTouching.value = false;

  // 清除长按定时器
  if (longPressTimer.value !== null) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }

  // 如果正在播放，停止播放
  if (isPlaying.value) {
    stopVideo();

    // 触觉反馈
    if ("vibrate" in navigator) {
      navigator.vibrate(25);
    }
  }
};

// 播放视频
const playVideo = async () => {
  if (!videoRef.value) {
    isPlayingNow = false;
    return;
  }

  // 如果视频还没准备好，触发加载
  if (!videoCanPlay.value) {
    try {
      videoRef.value.load();
    } catch {
      // ignore
    }

    // 等待视频元数据加载
    return new Promise<void>((resolve) => {
      const handler = () => {
        videoRef.value?.removeEventListener("loadedmetadata", handler);
        videoCanPlay.value = true;
        // 元数据加载完成后，再次调用 playVideo
        playVideo().then(resolve);
      };

      const timeout = setTimeout(() => {
        videoRef.value?.removeEventListener("loadedmetadata", handler);
        isPlayingNow = false;
        resolve();
      }, 3000); // 3秒超时

      videoRef.value?.addEventListener("loadedmetadata", () => {
        clearTimeout(timeout);
        handler();
      });
    });
  }

  try {
    // 重置到开头
    videoRef.value.currentTime = 0;
    isPlaying.value = true;

    // 应用静音设置
    videoRef.value.muted = isMuted.value;
    videoRef.value.playsInline = true;

    const playPromise = videoRef.value.play();

    if (playPromise !== undefined) {
      await playPromise;
    }
  } catch (error: any) {
    // 忽略 AbortError（正常中断）
    if (error.name === "AbortError") {
      return;
    }

    // 其他错误需要重置状态
    console.error("❌ 播放失败:", error);
    isPlaying.value = false;
    isPlayingNow = false;
  }
};

// 停止视频
const stopVideo = () => {
  if (!videoRef.value) return;

  try {
    if (!videoRef.value.paused) {
      videoRef.value.pause();
    }
    setTimeout(() => {
      videoRef.value.currentTime = 0;
    }, 300);
  } catch (error) {
    console.error("⚠️ 停止视频出错:", error);
  }

  isPlaying.value = false;
  isPlayingNow = false;
};

// 视频自然结束（参考 chronoframe）
const handleVideoEnded = () => {
  if (videoRef.value) {
    videoRef.value.currentTime = 0;
  }

  // 触觉反馈
  if (isMobile.value && "vibrate" in navigator) {
    navigator.vibrate(30);
  }

  // 立即恢复到图片，避免黑屏
  isPlaying.value = false;
  isPlayingNow = false;
};

// 点击处理 - 防止播放中误触（参考 chronoframe）
const handleClick = (event: MouseEvent) => {
  // 移动端：如果正在播放或触摸中，阻止点击事件
  if (isMobile.value && (isPlaying.value || isTouching.value)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  // 传递点击事件
  emit("click", event);
};

// 静音切换
const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (videoRef.value) {
    videoRef.value.muted = isMuted.value;
  }
};

// 清理
onUnmounted(() => {
  if (longPressTimer.value !== null) {
    clearTimeout(longPressTimer.value);
  }

  // 释放缓存的 URL
  if (cachedVideoUrl.value) {
    URL.revokeObjectURL(cachedVideoUrl.value);
    cachedVideoUrl.value = null;
  }
});

// 监听视频 URL 变化，预加载到缓存
watch(
  () => props.videoUrl,
  async (newUrl) => {
    if (!newUrl || !props.photoId || !props.isLive) return;

    console.log(`👀 开始缓存: ${props.photoId}`);

    try {
      const blob = await loadLivePhoto(newUrl, props.photoId);
      if (blob) {
        // 释放旧的 URL
        if (cachedVideoUrl.value) {
          console.log(`🗑️ 释放旧的 Object URL: ${props.photoId}`);
          URL.revokeObjectURL(cachedVideoUrl.value);
        }

        // 创建新的 object URL
        cachedVideoUrl.value = URL.createObjectURL(blob);
        console.log(
          `🎬 Object URL 已创建: ${cachedVideoUrl.value.substring(0, 50)}...`,
        );

        // 移动端预加载元数据，避免首次播放卡住
        if (isMobile.value && videoRef.value) {
          await nextTick();
          try {
            videoRef.value.load();
          } catch {
            // ignore
          }
        }
      } else {
        console.warn(`⚠️ 缓存失败: ${props.photoId} (blob 为 null)`);
      }
    } catch (error) {
      console.error("❌ 缓存异常:", error);
    }
  },
  {
    immediate: true,
    flush: "post", // 后置刷新，避免快速重复触发
  },
);

// 组件挂载时预加载
// ⚠️ 注意：watch with immediate: true 已经会在挂载时加载，不需要再在 onMounted 中加载
// onMounted 的加载已移除以避免重复请求
</script>

<style scoped>
@keyframes livephoto-spin {
  to {
    transform: rotate(360deg) scale(var(--livephoto-scale, 1));
  }
}

.livephoto-spin {
  animation: livephoto-spin 1s linear infinite;
  transform-origin: center;
}

.livephoto-scale {
  transform: scale(var(--livephoto-scale, 1));
  transform-origin: center;
}

video::-webkit-media-controls,
video::-webkit-media-controls-enclosure,
video::-webkit-media-controls-panel,
video::-webkit-media-controls-overlay-play-button,
video::-webkit-media-controls-play-button,
video::-webkit-media-controls-start-playback-button {
  display: none !important;
}
</style>

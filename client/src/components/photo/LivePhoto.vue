<template>
  <div
    ref="containerRef"
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
        @load="handleCoverLoad"
        @error="handleCoverError"
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
import { APP_CONFIG } from "@/config";
import { useLivePhotoCache } from "@/composables/useLivePhotoCache";
import { observeSharedVisibility } from "@/composables/useSharedVisibilityObserver";

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
const { loadLivePhoto } = useLivePhotoCache();
const cachedVideoUrl = ref<string | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// Refs
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const videoCanPlay = ref(false);
const isMuted = ref(true); // 默认静音
const coverLoaded = ref(false);
const coverLoadFailed = ref(false);

// Touch interaction state
const isTouching = ref(false);
const isHovering = ref(false);
const longPressTimer = ref<number | null>(null);
const stopVideoTimer = ref<number | null>(null);
const playVideoTimeout = ref<number | null>(null);
const isPreloadVisible = ref(false);

// 防止重复触发的标志
let isPlayingNow = false;
let stopObservingVisibility: (() => void) | null = null;
let preloadPromise: Promise<boolean> | null = null;

// Mobile detection - 简化版
const isMobile = computed(() => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
});

const releaseCachedVideoUrl = () => {
  if (cachedVideoUrl.value) {
    URL.revokeObjectURL(cachedVideoUrl.value);
    cachedVideoUrl.value = null;
  }
};

const canStartPlayback = () => {
  return Boolean(
    props.isLive &&
      props.videoUrl &&
      coverLoaded.value &&
      !coverLoadFailed.value,
  );
};

const handleCoverLoad = () => {
  coverLoaded.value = true;
  coverLoadFailed.value = false;
};

const handleCoverError = () => {
  coverLoaded.value = false;
  coverLoadFailed.value = true;
  stopVideo();
};

const ensureVideoLoaded = async () => {
  if (!props.videoUrl || !props.photoId || !props.isLive) {
    return false;
  }

  if (cachedVideoUrl.value) {
    return true;
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    try {
      const blob = await loadLivePhoto(props.videoUrl!, props.photoId!);
      if (!blob) {
        return false;
      }

      releaseCachedVideoUrl();
      cachedVideoUrl.value = URL.createObjectURL(blob);
      await nextTick();

      if (videoRef.value) {
        try {
          videoRef.value.load();
        } catch {
          // ignore
        }
      }

      return true;
    } catch {
      return false;
    } finally {
      preloadPromise = null;
    }
  })();

  return preloadPromise;
};

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
  videoCanPlay.value = false;
  isPlaying.value = false;
  isPlayingNow = false;
};

// 桌面端 - 鼠标悬停播放
const handleMouseEnter = async () => {
  if (isMobile.value || !props.isLive || !props.videoUrl) return;
  if (!canStartPlayback()) return;

  // 已经在悬停状态，直接返回
  if (isHovering.value) return;

  isHovering.value = true;

  if (!videoCanPlay.value) {
    void ensureVideoLoaded();
  }

  isPlayingNow = true;
  await playVideo();
};

const handleMouseLeave = (event: MouseEvent) => {
  if (isMobile.value) return;

  // 简单粗暴：直接停止播放
  // 因为 mouseleave 事件本身就表示鼠标离开了容器
  isHovering.value = false;
  isPlayingNow = false;

  // 如果正在播放，停止
  if (isPlaying.value) {
    stopVideo();
  }
};

// 移动端 - 长按触发 (350ms)
const handleTouchStart = (event: TouchEvent) => {
  if (!isMobile.value || !props.isLive || !props.videoUrl) return;
  if (!canStartPlayback()) return;

  // 已经在播放，不要重复调用
  if (isPlayingNow) return;

  void ensureVideoLoaded();

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
  isPlayingNow = false;

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
  if (!canStartPlayback()) {
    isPlayingNow = false;
    return;
  }

  // 如果视频还没准备好，触发加载
  if (!videoCanPlay.value) {
    if (preloadPromise) {
      await preloadPromise.catch(() => false);
      await nextTick();
    }

    try {
      videoRef.value.load();
    } catch {
      // ignore
    }

    const ready = await new Promise<boolean>((resolve) => {
      const video = videoRef.value;
      if (!video) {
        resolve(false);
        return;
      }

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", handleReady);
        video.removeEventListener("canplay", handleReady);
        video.removeEventListener("error", handleFailure);
        if (playVideoTimeout.value !== null) {
          clearTimeout(playVideoTimeout.value);
          playVideoTimeout.value = null;
        }
      };

      const handleReady = () => {
        cleanup();
        videoCanPlay.value = true;
        resolve(true);
      };

      const handleFailure = () => {
        cleanup();
        resolve(false);
      };

      if (video.readyState >= 1) {
        videoCanPlay.value = true;
        resolve(true);
        return;
      }

      playVideoTimeout.value = window.setTimeout(() => {
        cleanup();
        resolve(false);
      }, 3000);

      video.addEventListener("loadedmetadata", handleReady, { once: true });
      video.addEventListener("canplay", handleReady, { once: true });
      video.addEventListener("error", handleFailure, { once: true });
    });

    if (!ready || !isPlayingNow || !canStartPlayback()) {
      isPlayingNow = false;
      return;
    }
  }

  try {
    if (!isPlayingNow || !canStartPlayback()) {
      isPlayingNow = false;
      return;
    }

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
    if (stopVideoTimer.value !== null) {
      clearTimeout(stopVideoTimer.value);
    }
    stopVideoTimer.value = window.setTimeout(() => {
      stopVideoTimer.value = null;
      if (videoRef.value) {
        videoRef.value.currentTime = 0;
      }
    }, 300);
  } catch (error) {
    // ignore
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
    longPressTimer.value = null;
  }
  if (stopVideoTimer.value !== null) {
    clearTimeout(stopVideoTimer.value);
    stopVideoTimer.value = null;
  }
  if (playVideoTimeout.value !== null) {
    clearTimeout(playVideoTimeout.value);
    playVideoTimeout.value = null;
  }

  if (stopObservingVisibility) {
    stopObservingVisibility();
    stopObservingVisibility = null;
  }

  releaseCachedVideoUrl();
});

onMounted(() => {
  if (!containerRef.value || !props.isLive || !props.videoUrl) return;

  stopObservingVisibility = observeSharedVisibility(
    containerRef.value,
    () => {
      isPreloadVisible.value = true;
      void ensureVideoLoaded();
    },
    {
      rootMargin: APP_CONFIG.livePhoto.viewportPreloadMargin,
    },
  );
});

// 监听视频参数变化，仅在进入预加载区域后主动缓存
watch(
  [() => props.videoUrl, () => props.photoId, () => props.isLive, () => props.imageUrl],
  async (newValues, oldValues) => {
    const [newUrl, newPhotoId, isLive, newImageUrl] = newValues;
    const [oldUrl, oldPhotoId, oldIsLive, oldImageUrl] = oldValues || [];

    if (
      newUrl !== oldUrl ||
      newPhotoId !== oldPhotoId ||
      isLive !== oldIsLive ||
      newImageUrl !== oldImageUrl
    ) {
      videoCanPlay.value = false;
      coverLoaded.value = false;
      coverLoadFailed.value = false;
      releaseCachedVideoUrl();
      stopVideo();
    }

    if (!newUrl || !newPhotoId || !isLive || !isPreloadVisible.value) {
      return;
    }

    await ensureVideoLoaded();
  },
  {
    immediate: true,
    flush: "post",
  },
);
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

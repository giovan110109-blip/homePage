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
      :src="videoUrl"
      muted
      playsinline
      preload="metadata"
      title=""
      aria-label=""
      tabindex="-1"
      controlsList="nodownload"
      disablePictureInPicture
      disableRemotePlayback
      @canplay="onVideoCanPlay"
      @timeupdate="onVideoTimeUpdate"
      @ended="handleVideoEnded"
      @error="onVideoError"
    />

    <!-- Hover 遮罩层 - 参考 chronoframe -->
    <div
      class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-[3] pointer-events-none"
    />

    <!-- 指示器 - 左上角，参考 chronoframe -->
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
        class="icon icon-tabler icons-tabler-outline icon-tabler-live-photo animate-spin transition-transform duration-300"
        :style="{ transform: `scale(${isPlaying ? 1.06 : 1})` }"
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
        :style="{ transform: `scale(${isPlaying ? 1.06 : 1})` }"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed, nextTick } from "vue";
import LazyImage from "./LazyImage.vue";

interface Props {
  imageUrl: string;
  videoUrl?: string;
  isLive?: boolean;
  thumbHash?: string;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isLive: false,
  width: 1,
  height: 1,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

// Refs
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const videoCanPlay = ref(false);

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

  // 已经在播放，不要重复调用
  if (isPlayingNow) return;

  // 如果已经显示悬停状态，不要重复设置
  if (isHovering.value) {
    return;
  }

  isHovering.value = true;

  // 直接开始播放
  if (videoCanPlay.value) {
    isPlayingNow = true;
    await playVideo();
  }
};

const handleMouseLeave = (event: MouseEvent) => {
  if (isMobile.value) return;
  

  const container = event.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  // 检查鼠标是否真的在容器外
  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    return;
  }

  // 鼠标真的在容器外了
  isHovering.value = false;
  isPlayingNow = false;
  stopVideo();
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

  if (!videoCanPlay.value) {
    // 等待视频准备好
    let retries = 0;
    const checkReady = setInterval(() => {
      retries++;
      if (videoCanPlay.value) {
        clearInterval(checkReady);
        playVideo();
        return;
      }
      if (retries > 10) {
        clearInterval(checkReady);
        isPlayingNow = false;
      }
    }, 100);
    return;
  }

  try {
    // 重置到开头
    videoRef.value.currentTime = 0;
    isPlaying.value = true;

    // 确保音量和内联播放设置
    videoRef.value.muted = true;
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

// 清理
onUnmounted(() => {
  if (longPressTimer.value !== null) {
    clearTimeout(longPressTimer.value);
  }
});
</script>

<style scoped>
video::-webkit-media-controls,
video::-webkit-media-controls-enclosure,
video::-webkit-media-controls-panel,
video::-webkit-media-controls-overlay-play-button,
video::-webkit-media-controls-play-button,
video::-webkit-media-controls-start-playback-button {
  display: none !important;
}
</style>

<script setup lang="ts">
import { AnimatePresence, motion, useDomRef } from "motion-v";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Keyboard, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/virtual";
import ThumbHash from "@/components/ui/ThumbHash.vue";
import { ChevronLeft, ChevronRight, Info, Share2, X } from "lucide-vue-next";
import { useLivePhotoCache } from "@/composables/useLivePhotoCache";
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "indexChange", value: number): void;
  (e: "loadMore"): void;
}>();

const props = defineProps<{
  modelValue: boolean;
  photos: Array<any>;
  currentPhoto: Record<string, any> | null;
  hasMore?: boolean;
  loadingMore?: boolean;
}>();

const loadingIndicatorRef = useTemplateRef("loadingIndicatorRef");
const swiperModules = [Keyboard, Virtual];
const swiperRef = ref<any>(null);
const activeIndex = ref(0);
const swiperExtraProps: Record<string, any> = {
  virtual: { enabled: true },
  keyboard: {
    enabled: true,
    onlyInViewport: true,
  },
};
// LivePhoto 状态
const videoCanPlay=ref(false)
const isLivePhotoHovering = ref(false);
const isLivePhotoPlaying = ref(false);
const isLivePhotoTouching = ref(false);
const isLivePhotoMuted = ref(true);
const touchCount = ref(0);
const longPressTimer = ref<any | null>(null);

// LivePhoto 预加载
const { preloadVideosInViewport, getState } = useLivePhotoCache();

// 缩放
const isImageZoomed = ref(false);
const showExifPanel = ref(false);
const showShareModal = ref(false);
const currentBlobSrc = ref<string | null>(null);
const zoomLevel = ref(0);
const showZoomLevel = ref(false);
const zoomLevelTimer = ref<any | null>(null);
const livePhotoVideoRef = useDomRef();

const isMobile = computed(() => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
});

const propsPhotoIndex = computed(() => {
  if (!props.currentPhoto) return 0;
  const id = props.currentPhoto._id ?? props.currentPhoto.id;
  const index = props.photos.findIndex((p) => (p?._id ?? p?.id) === id);
  return index >= 0 ? index : 0;
});

const activePhoto = computed(() => {
  return props.photos[activeIndex.value] || props.currentPhoto || {};
});

const handleSwiperInit = (swiper: any) => {
  swiperRef.value = swiper;
};

const handleSlideChange = (swiper: any) => {
  activeIndex.value = swiper.activeIndex ?? 0;
  emit("indexChange", activeIndex.value);

  // 👉 当切换照片时，智能预加载相邻 LivePhoto 视频
  preloadAdjacentLivePhotos(activeIndex.value);

  // ✅ 动态加载下一页：当用户滑动到倒数第 3 张照片时，自动加载下一页
  const remainingPhotos = props.photos.length - activeIndex.value;
  if (remainingPhotos <= 3 && props.hasMore && !props.loadingMore) {
    console.log(
      `📄 即将到达末尾 (剩余 ${remainingPhotos} 张)，自动加载下一页...`,
    );
    emit("loadMore");
  }
};

const handleThumbnailIndexChange = (index: number) => {
  activeIndex.value = index;
  if (swiperRef.value) {
    swiperRef.value.slideTo(index, 0);
  }
  emit("indexChange", index);
};

// 图片事件处理
const handleZoomChange = (isZoomed: boolean, level?: number) => {
  isImageZoomed.value = isZoomed;
  if (level !== undefined) {
    zoomLevel.value = level;
    // 缩放变化时显示缩放倍率 2 秒
    showZoomLevel.value = true;
    if (zoomLevelTimer.value) {
      clearTimeout(zoomLevelTimer.value);
    }
    zoomLevelTimer.value = setTimeout(() => {
      showZoomLevel.value = false;
      zoomLevelTimer.value = null;
    }, 2000);
  }
};

const handleBlobSrcChange = (blobSrc: string | null) => {
  currentBlobSrc.value = blobSrc;
};

const handleImageLoaded = () => {
  // 图片加载完成时显示缩放倍率 2 秒
  showZoomLevel.value = true;
  if (zoomLevelTimer.value) {
    clearTimeout(zoomLevelTimer.value);
  }
  zoomLevelTimer.value = setTimeout(() => {
    showZoomLevel.value = false;
    zoomLevelTimer.value = null;
  }, 2000);
};

// 导航方法
const handlePrevious = () => {
  if (activeIndex.value > 0) {
    swiperRef.value?.slidePrev();
  }
};

const handleNext = () => {
  if (activeIndex.value < props.photos.length - 1) {
    swiperRef.value?.slideNext();
  }
};

const handleEscClose = (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  if (!props.modelValue) return;
  emit("update:modelValue", false);
};

/**
 * 智能预加载相邻 LivePhoto 视频
 */
const preloadAdjacentLivePhotos = (currentIndex: number) => {
  const livePhotos = props.photos
    .map((photo, index) => {
      const isCurrentOrAdjacent = Math.abs(index - currentIndex) <= 1;
      return {
        id: photo._id || photo.id,
        videoUrl: photo.videoUrl || photo.livePhotoVideoUrl || "",
        isVisible: isCurrentOrAdjacent,
      };
    })
    .filter((item) => item.videoUrl);

  if (livePhotos.length === 0) return;

  // 预加载：单张场景，降低并发数，避免占用过多资源
  preloadVideosInViewport(livePhotos, {
    maxConcurrent: 1,
    prioritizeVisible: true,
    prefetchDistance: 2,
  }).catch((err) => {
    console.warn("⚠️ LivePhoto 预加载出错:", err);
  });
};

const handleLivePhotoMouseEnter = () => {
  if (
    !isMobile.value &&
    activePhoto.value?.isLive &&
    activePhoto.value?.videoUrl
  ) {
    isLivePhotoHovering.value = true;
    playLivePhotoVideo();
  }
};

const handleLivePhotoMouseLeave = () => {
  if (!isMobile.value) {
    isLivePhotoHovering.value = false;
    stopLivePhotoVideo();
  }
};

const handleLivePhotoIndicatorClick = () => {
  if (
    !activePhoto.value?.videoUrl ||
    !(activePhoto.value?.isLive || activePhoto.value?.isLivePhoto)
  ) {
    return;
  }

  if (isLivePhotoPlaying.value) {
    stopLivePhotoVideo();
    return;
  }

  playLivePhotoVideo();
};

const playLivePhotoVideo = () => {
  if (!livePhotoVideoRef.value || !activePhoto.value?.videoUrl) return;

  // 依赖 canplay：未就绪时先触发加载，等 canplay 事件
  if (!videoCanPlay.value) {
    try {
      livePhotoVideoRef.value.load();
    } catch {
      // ignore
    }
    return;
  }

  livePhotoVideoRef.value.currentTime = 0;
  isLivePhotoPlaying.value = true;

  // 移动端开始播放时提供触觉反馈
  if (isMobile.value && "vibrate" in navigator) {
    navigator.vibrate(50); // 开始播放的短震动
  }

  livePhotoVideoRef.value?.play().catch((error: any) => {
    console.warn("Failed to play LivePhoto video in viewer:", error);
    isLivePhotoPlaying.value = false;
  });
};

const stopLivePhotoVideo = () => {
  const wasPlaying = isLivePhotoPlaying.value;

  if (livePhotoVideoRef.value && !livePhotoVideoRef.value.paused) {
    livePhotoVideoRef.value?.pause();
    livePhotoVideoRef.value.currentTime = 0;

    // 移动端手动停止播放时提供触觉反馈
    if (isMobile.value && wasPlaying && "vibrate" in navigator) {
      navigator.vibrate(25); // 手动停止的极短震动
    }
  }
  isLivePhotoPlaying.value = false;
};
const handleLivePhotoTouchStart = (event: TouchEvent) => {
  if (
    isMobile.value &&
    (activePhoto.value?.isLive || activePhoto.value?.isLivePhoto) &&
    activePhoto.value?.videoUrl
  ) {
    touchCount.value = event.touches.length;

    // 仅处理单指触摸，避免与捏合缩放冲突
    if (event.touches.length === 1) {
      // 判断触摸目标是否为可交互元素（按钮等）
      const target = event.target as HTMLElement;
      const isInteractiveElement =
        target.closest("button") ||
        target.closest('[role="button"]') ||
        target.classList.contains("pointer-events-auto");

      // 可交互元素不阻止默认行为，保证点击可用
      if (!isInteractiveElement) {
        // 阻止浏览器长按默认行为（菜单、保存图片等）
        event.preventDefault();
        isLivePhotoTouching.value = true;

        // 设置长按定时器后再开始播放
        longPressTimer.value = setTimeout(() => {
          // 双重确认：仍为单指且处于触摸状态才播放
          if (
            isLivePhotoTouching.value &&
            touchCount.value === 1 &&
            !isImageZoomed.value
          ) {
            playLivePhotoVideo();
          }
        }, 350);
      }
    }
  }
};

const handleLivePhotoTouchEnd = () => {
  if (isMobile.value) {
    touchCount.value = 0;
    isLivePhotoTouching.value = false;

    // 清理长按定时器
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }

    // 停止视频播放
    stopLivePhotoVideo();
  }
};

const handleLivePhotoTouchMove = (event: TouchEvent) => {
  if (isMobile.value && isLivePhotoTouching.value) {
    touchCount.value = event.touches.length;

    // 若用户加上更多手指（捏合缩放），取消 LivePhoto 播放
    if (event.touches.length > 1) {
      isLivePhotoTouching.value = false;

      // 清理长按定时器
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
      }

      // 停止视频播放
      stopLivePhotoVideo();
    }
  }
};

const handleLivePhotoVideoEnded = () => {
  // 移动端播放结束时提供触觉反馈
  if (isMobile.value && "vibrate" in navigator) {
    navigator.vibrate(30); // 播放结束的短震动
  }

  // 视频自然结束，保持可见并回到开头
  if (livePhotoVideoRef.value) {
    livePhotoVideoRef.value.currentTime = 0;
  }
};

const handleLivePhotoMuteChange = (value: boolean) => {
  isLivePhotoMuted.value = value;
  if (livePhotoVideoRef.value && livePhotoVideoRef.value.muted !== value) {
    livePhotoVideoRef.value.muted = value;
  }
};

// 视频元数据加载完成
const onVideoCanPlay = () => {
  videoCanPlay.value = true;
};

watch(
  () => props.modelValue,
  async (newVal) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = newVal ? "hidden" : "";
    if (typeof window !== "undefined") {
      if (newVal) {
        window.addEventListener("keydown", handleEscClose);
      } else {
        window.removeEventListener("keydown", handleEscClose);
      }
    }
    if (!newVal) {
      showExifPanel.value = false;
    }
    if (newVal) {
      activeIndex.value = propsPhotoIndex.value;
      await nextTick();
      if (swiperRef.value) {
        swiperRef.value.slideTo(activeIndex.value, 0);
      }
      // 👉 打开查看器时，预加载初始照片的相邻 LivePhoto
      preloadAdjacentLivePhotos(activeIndex.value);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleEscClose);
  }
});
</script>

<template>
  <Teleport to="body">
    <!-- 背景层 -->
    <AnimatePresence>
      <motion.div
        v-if="modelValue"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.3 }"
        class="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-2xl z-50"
        @click="emit('update:modelValue', false)"
      />
    </AnimatePresence>
    <!-- 交叉溶解的 Thumbhash 背景 -->
    <AnimatePresence mode="sync">
      <motion.div
        v-if="
          modelValue && (activePhoto.thumbHash || activePhoto.thumbnailHash)
        "
        :key="activePhoto._id || activePhoto.id"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.3 }"
        class="fixed inset-0 z-40"
      >
        <ThumbHash
          :thumbhash="activePhoto.thumbHash || activePhoto.thumbnailHash"
          class="w-full h-full scale-110"
        />
      </motion.div>
    </AnimatePresence>

    <!-- 主内容区域 -->
    <AnimatePresence>
      <motion.div
        v-if="modelValue"
        ref="containerRef"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.3 }"
        class="fixed inset-0 z-50 flex overflow-hidden"
        :class="
          isMobile
            ? 'items-stretch justify-start'
            : 'items-center justify-center'
        "
        @click="emit('update:modelValue', false)"
      >
        <div
          class="flex w-full h-full"
          :class="isMobile ? 'flex-col' : ''"
          @click.stop
        >
          <!-- 图片显示区域 -->
          <div class="z-10 flex min-h-0 min-w-0 flex-1 flex-col">
            <div class="group relative flex min-h-0 min-w-0 flex-1">
              <!-- 顶部工具栏 -->
              <motion.div
                :initial="{ opacity: 0 }"
                :animate="{ opacity: 1 }"
                :exit="{ opacity: 0 }"
                :transition="{ duration: 0.3 }"
                class="absolute z-30 flex items-center justify-between"
                :class="
                  isMobile
                    ? 'top-[calc(env(safe-area-inset-top)+0.5rem)] right-2 left-2'
                    : 'top-4 right-4 left-4'
                "
              >
                <!-- 左侧工具按钮 -->
                <div class="flex items-center gap-2">
                  <!-- LivePhoto 标志 -->
                  <LivePhotoIndicator
                    v-if="activePhoto?.isLive"
                    :class="isMobile ? 'cursor-default' : 'cursor-pointer'"
                    :photo="activePhoto"
                    :is-video-playing="isLivePhotoPlaying"
                    :processing-state="videoCanPlay"
                    @mouseenter="handleLivePhotoMouseEnter"
                    @mouseleave="handleLivePhotoMouseLeave"
                    @click="handleLivePhotoIndicatorClick"
                  />
                  <!-- 静音图标 -->
                  <LivePhotoMute
                    v-if="activePhoto?.isLive"
                    class="h-7 w-7"
                    :modelValue="isLivePhotoMuted"
                    @update:modelValue="handleLivePhotoMuteChange"
                  ></LivePhotoMute>
                </div>

                <!-- 右侧按钮组 -->
                <div class="flex items-center gap-2">
                  <!-- <button
                    class="pointer-events-auto backdrop-blur-md bg-black/40 text-white rounded-full  p-2 flex items-center justify-center hover:bg-black/60 transition"
                    @click="showShareModal = true"
                  >
                    <Share2 ></Share2>
                  </button> -->
                  <!-- 信息按钮 (移动端) -->
                  <button
                    v-if="isMobile"
                    class="pointer-events-auto backdrop-blur-md bg-black/40 text-white rounded-full h-9 w-9 flex items-center justify-center hover:bg-black/60 transition"
                    @click="showExifPanel = !showExifPanel"
                  >
                    <Info :size="18" />
                  </button>
                  <!-- 关闭按钮 -->
                  <button
                    class="pointer-events-auto backdrop-blur-md bg-black/40 text-white rounded-full h-9 w-9 flex items-center justify-center hover:bg-black/60 transition"
                    @click="emit('update:modelValue', false)"
                  >
                    <X :size="18" />
                  </button>
                </div>
              </motion.div>
              <!-- 加载指示器 -->
              <LoadingIndicator ref="loadingIndicatorRef" />
              <!-- Swiper 容器 -->
              <Swiper
                :modules="swiperModules"
                :space-between="0"
                :slides-per-view="1"
                :initial-slide="propsPhotoIndex"
                v-bind="swiperExtraProps"
                :class="[
                  'h-full w-full',
                  isMobile
                    ? 'pt-[calc(env(safe-area-inset-top)+2.25rem)] pb-[env(safe-area-inset-bottom)]'
                    : '',
                ]"
                :style="{ touchAction: isMobile ? 'pan-x' : 'pan-y' }"
                @swiper="handleSwiperInit"
                @slide-change="handleSlideChange"
              >
                <SwiperSlide
                  v-for="(photo, index) in photos"
                  :key="photo._id || photo.id || index"
                  :virtual-index="index"
                  class="flex items-center justify-center"
                >
                  <motion.div
                    :initial="{ opacity: 0.5, scale: 0.95 }"
                    :animate="{ opacity: 1, scale: 1 }"
                    :exit="{ opacity: 0, scale: 0.95 }"
                    :transition="{ type: 'spring', duration: 0.4, bounce: 0 }"
                    class="relative flex h-full w-full items-center justify-center"
                    style="
                      user-select: none;
                      -webkit-user-select: none;
                      -webkit-touch-callout: none;
                      -webkit-tap-highlight-color: transparent;
                    "
                    @touchstart="handleLivePhotoTouchStart"
                    @touchmove="handleLivePhotoTouchMove"
                    @touchend="handleLivePhotoTouchEnd"
                    @touchcancel="handleLivePhotoTouchEnd"
                    @contextmenu.prevent=""
                  >
                    <!-- 主图 -->
                    <ProgressiveImage
                      class="h-full w-full object-contain transition-opacity duration-400"
                      :class="{
                        'opacity-0': isLivePhotoPlaying && currentPhoto?.isLive,
                      }"
                      :loading-indicator-ref="loadingIndicatorRef || null"
                      :is-current-image="index === activeIndex"
                      :src="photo.originalUrl!"
                      :high-res-src="photo.originalFileUrl"
                      :thumbhash="photo.thumbnailHash"
                      :alt="photo.title || ''"
                      :width="
                        index === activeIndex
                          ? (currentPhoto?.width ?? undefined)
                          : undefined
                      "
                      :height="
                        index === activeIndex
                          ? (currentPhoto?.height ?? undefined)
                          : undefined
                      "
                      :enable-pan="
                        index === activeIndex
                          ? !isMobile || isImageZoomed
                          : true
                      "
                      :enable-zoom="true"
                      :on-zoom-change="
                        index === activeIndex ? handleZoomChange : undefined
                      "
                      :on-blob-src-change="
                        index === activeIndex ? handleBlobSrcChange : undefined
                      "
                      :on-image-loaded="
                        index === activeIndex ? handleImageLoaded : undefined
                      "
                      :is-live-photo="photo.isLive === 1"
                      :live-photo-video-url="photo.videoUrl || undefined"
                    />

                    <!-- LivePhoto 视频 -->
                    <motion.video
                      v-if="
                        photo.isLive && index === activeIndex && photo.videoUrl
                      "
                      :ref="
                        (el) => {
                          if (index === activeIndex) livePhotoVideoRef = el;
                        }
                      "
                      :src="photo.videoUrl"
                      class="absolute inset-0 w-full h-full object-contain pointer-events-none select-none touch-none"
                      :muted="isLivePhotoMuted"
                      playsinline
                      preload="metadata"
                      :initial="{ opacity: 0 }"
                      :animate="{
                        opacity: isLivePhotoPlaying ? 1 : 0,
                      }"
                      :transition="{
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: isLivePhotoPlaying ? 0.1 : 0,
                      }"
                      @ended="handleLivePhotoVideoEnded"
                      @canplay="onVideoCanPlay"
                      @contextmenu.prevent=""
                    />
                    <!-- 缩放倍率提示 -->
                    <AnimatePresence>
                      <motion.div
                        v-if="showZoomLevel && zoomLevel > 0"
                        :initial="{ opacity: 0, y: 10 }"
                        :animate="{ opacity: 1, y: 0 }"
                        :exit="{ opacity: 0, y: 10 }"
                        :transition="{ duration: 0.2 }"
                        class="absolute bottom-4 left-4 z-20 bg-black/40 backdrop-blur-3xl rounded-xl border border-white/10 px-4 py-2 shadow-2xl"
                      >
                        <span class="text-white font-medium"
                          >{{ zoomLevel }}x</span
                        >
                      </motion.div>
                    </AnimatePresence>
                    <!-- 操作提示 -->
                    <AnimatePresence>
                      <motion.div
                        v-if="!isImageZoomed && !isLivePhotoPlaying"
                        :initial="{ opacity: 0, scale: 0.95 }"
                        :animate="{ opacity: 0.6, scale: 1 }"
                        :exit="{ opacity: 0, scale: 0.95 }"
                        :transition="{ duration: 0.2 }"
                        class="absolute bottom-6 left-0 right-0 z-20 flex justify-center"
                      >
                        <div
                          class="max-w-[90%] w-fit bg-black/50 rounded-lg border border-white/10 px-2 py-1 shadow-2xl text-white text-xs font-bold text-center"
                        >
                          <span v-if="currentPhoto?.isLivePhoto && isMobile">
                            "长按播放实况照片 · 双击或捏合缩放"
                          </span>
                          <span
                            v-else-if="currentPhoto?.isLivePhoto && !isMobile"
                          >
                            "悬停左上播放 · 双击/滚轮缩放"
                          </span>
                          <span v-else>
                            {{
                              isMobile
                                ? "双击或捏合缩放"
                                : "双击或用鼠标滚轮缩放"
                            }}
                          </span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </SwiperSlide>
              </Swiper>

              <!-- 自定义导航按钮 (桌面端) -->
              <template v-if="!isMobile">
                <button
                  v-if="activeIndex > 0"
                  type="button"
                  class="absolute top-1/2 left-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 bg-black/30 hover:bg-black/40"
                  @click="handlePrevious"
                >
                  <ChevronLeft :size="24" />
                </button>

                <button
                  v-if="activeIndex < photos.length - 1"
                  type="button"
                  class="absolute top-1/2 right-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 bg-black/30 hover:bg-black/40"
                  @click="handleNext"
                >
                  <ChevronRight :size="24" />
                </button>
              </template>
            </div>
            <!-- 缩略图导航 -->
            <div
              :class="
                isMobile
                  ? 'sticky bottom-0 z-20 bg-black/30 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]'
                  : ''
              "
            >
              <GalleryThumbnail
                :current-index="activeIndex"
                :photos="photos"
                @index-change="handleThumbnailIndexChange"
              />
            </div>
          </div>

          <!-- EXIF 面板 - 桌面端常驻，移动端可切换 -->
          <InfoPanel
            v-if="!isMobile && activePhoto && activePhoto._id"
            :current-photo="activePhoto"
            :exif-data="activePhoto?.exif"
          />
          <AnimatePresence v-if="isMobile">
            <InfoPanel
              v-if="showExifPanel && activePhoto && activePhoto._id"
              :current-photo="activePhoto"
              :exif-data="activePhoto?.exif"
              :on-close="() => (showExifPanel = false)"
            />
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
    <ShareModal
      v-if="currentPhoto"
      :is-open="showShareModal"
      :photo="currentPhoto"
      @close="showShareModal = false"
    ></ShareModal>
  </Teleport>
</template>

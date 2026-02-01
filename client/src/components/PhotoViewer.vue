<script setup lang="ts">
import { Teleport, computed, watch, onBeforeUnmount, ref, nextTick } from "vue";
import { AnimatePresence, motion } from "motion-v";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Keyboard, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/virtual";
import ThumbHash from "@/components/ui/ThumbHash.vue";
import GalleryThumbnail from "@/components/GalleryThumbnail.vue";

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "indexChange", value: number): void;
}>();

const props = defineProps<{
  modelValue: boolean;
  photos: Array<any>;
  currentPhoto: Record<string, any> | null;
}>();

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

const isMobile = computed(() => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
});

const currentIndex = computed(() => {
  if (!props.currentPhoto) return 0;
  const id = props.currentPhoto._id ?? props.currentPhoto.id;
  const index = props.photos.findIndex((p) => (p?._id ?? p?.id) === id);
  return index >= 0 ? index : 0;
});

const currentNowPhoto = computed(() => {
  return props.photos[activeIndex.value] || props.currentPhoto || {};
});

const handleSwiperInit = (swiper: any) => {
  swiperRef.value = swiper;
};

const handleSlideChange = (swiper: any) => {
  activeIndex.value = swiper.activeIndex ?? 0;
};

const handleThumbnailIndexChange = (index: number) => {
  activeIndex.value = index;
  if (swiperRef.value) {
    swiperRef.value.slideTo(index, 0);
  }
  emit("indexChange", index);
};

watch(
  () => props.modelValue,
  async (newVal) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = newVal ? "hidden" : "";
    if (newVal) {
      activeIndex.value = currentIndex.value;
      await nextTick();
      if (swiperRef.value) {
        swiperRef.value.slideTo(activeIndex.value, 0);
      }
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
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
          modelValue &&
          (currentNowPhoto.thumbHash || currentNowPhoto.thumbnailHash)
        "
        :key="currentNowPhoto._id || currentNowPhoto.id"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.3 }"
        class="fixed inset-0 z-40"
      >
        <ThumbHash
          :thumbhash="
            currentNowPhoto.thumbHash || currentNowPhoto.thumbnailHash
          "
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
        class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        @click="emit('update:modelValue', false)"
      >
        <div class="flex w-full h-full" @click.stop>
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
                  isMobile ? 'top-2 right-2 left-2' : 'top-4 right-4 left-4'
                "
              >
                <!-- 左侧工具按钮 -->
                <div class="flex items-center gap-1">
                  <!-- LivePhoto 标志 -->
                  <!-- 静音图标 -->
                </div>

                <!-- 右侧按钮组 -->
                <div class="flex items-center gap-2">
                  <!-- 关闭按钮 -->
                  <button
                    class="pointer-events-auto backdrop-blur-md bg-black/40 text-white rounded-full p-2 flex items-center justify-center hover:bg-black/60 transition"
                    @click="emit('update:modelValue', false)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="icon icon-tabler icons-tabler-outline icon-tabler-x"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M18 6l-12 12" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>

              <!-- Swiper 容器 -->
              <Swiper
                :modules="swiperModules"
                :space-between="0"
                :slides-per-view="1"
                :initial-slide="currentIndex"
                v-bind="swiperExtraProps"
                class="h-full w-full pb-24"
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
                  <img
                    :src="photo.originalUrl"
                    :alt="photo.title || ''"
                    class="max-h-full max-w-full object-contain"
                  />
                </SwiperSlide>
              </Swiper>
              <!-- 缩略图导航 -->
              <div class="absolute inset-x-0 bottom-0 z-20">
                <GalleryThumbnail
                  :current-index="activeIndex"
                  :photos="photos"
                  @index-change="handleThumbnailIndexChange"
                />
              </div>
            </div>
          </div>

                    <!-- EXIF 面板 - 在桌面端始终显示，在移动端根据状态显示 -->
          <AnimatePresence v-if="isMobile">
            <InfoPanel
              v-if="currentPhoto"
              :current-photo="currentPhoto"
              :exif-data="currentPhoto?.exif"
            />
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>

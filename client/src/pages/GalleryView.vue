<template>
  <div class="min-h-screen bg-black">
    <div class="w-full h-full">
      <!-- 瀑布流照片墙 -->
      <MasonryWall
        v-if="!loading && photos.length > 0"
        :items="photos"
        :column-width="columnWidth"
        :gap="gridGap"
        :min-columns="minColumns"
        :max-columns="maxColumns"
        :key-mapper="keyMapper"
        class="masonry p-1 sm:p-2"
      >
        <template #default="{ item: photo }">
          <div class="group cursor-pointer" @click="viewPhoto(photo)">
            <div
              class="relative overflow-hidden rounded-md shadow-lg transition-all bg-gray-900"
            >
              <LivePhoto
                v-if="photo.isLive"
                :image-url="photo.originalUrl"
                :video-url="photo.videoUrl"
                :is-live="photo.isLive"
                :thumb-hash="photo.thumbHash || photo.thumbnailHash"
                :width="photo.width"
                :height="photo.height"
                :photo-id="photo._id"
              />
              <LazyImage
                v-else
                :src="photo.originalUrl"
                :thumb-hash="photo.thumbHash || photo.thumbnailHash"
                :width="photo.width"
                :height="photo.height"
              />

              <!-- 悬浮信息 -->
              <div
                v-if="!photo.isLive"
                class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-3"
              >
                <h3
                  class="text-white font-medium text-xs sm:text-sm line-clamp-1"
                >
                  {{ photo.title }}
                </h3>
                <p class="text-gray-300 text-xs hidden sm:block">
                  {{ formatDate(photo.dateTaken) }}
                </p>
                <div
                  v-if="photo.geoinfo?.city"
                  class="flex items-center gap-1 text-gray-400 text-xs mt-1"
                >
                  <MapPin class="w-3 h-3" />
                  {{ photo.geoinfo.city }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </MasonryWall>
    </div>

    <!-- 照片查看器 -->
    <PhotoViewer
      :modelValue="photoDialogVisible"
      :photos="photos"
      :currentPhoto="currentPhoto"
      @update:modelValue="photoDialogVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { MapPin } from "lucide-vue-next";
import MasonryWall from "@yeger/vue-masonry-wall";
import request from "@/api/request";
import { getAssetURL } from "@/utils";
import LazyImage from "@/components/LazyImage.vue";
import LivePhoto from "@/components/LivePhoto.vue";
import PhotoViewer from "@/components/PhotoViewer.vue";
import type { Photo } from "@/types/api";

interface PhotoWithLoaded extends Photo {
  loaded?: boolean;
}

import { useImageLoader } from "@/composables/useImageLoader";

const photos = ref<PhotoWithLoaded[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const photoDialogVisible = ref(false);
const currentPhoto = ref<PhotoWithLoaded | null>(null);

const windowWidth = ref(window.innerWidth);

// 检测是否是移动端
const isMobile = computed(() => {
  return windowWidth.value < 768;
});

// 响应式列宽
const columnWidth = computed(() => {
  const width = windowWidth.value;
  if (width < 640) return 160; // 手机：2列
  if (width < 1024) return 240; // 平板：3-4列
  if (width < 1536) return 300; // 小屏PC：4-5列
  return 360; // 大屏PC：5-6列
});

const minColumns = computed(() => {
  const width = windowWidth.value;
  if (width < 640) return 2;
  if (width < 1024) return 3;
  if (width < 1536) return 4;
  return 5;
});

const maxColumns = computed(() => {
  const width = windowWidth.value;
  if (width < 640) return 2;
  if (width < 1024) return 4;
  if (width < 1536) return 5;
  return 6;
});

const gridGap = computed(() => {
  const width = windowWidth.value;
  if (width < 640) return 6;
  if (width < 1024) return 8;
  return 10;
});

const keyMapper = (item: PhotoWithLoaded) => item._id;

const pagination = reactive({
  page: 1,
  limit: 9999, // 全量加载
  total: 0,
  pages: 1,
});

const hasMore = ref(false);

const loadPhotos = async (reset = true) => {
  if (reset) {
    pagination.page = 1;
    photos.value = [];
  }

  loading.value = reset;
  loadingMore.value = !reset;

  try {
    const params: any = {
      page: 1, // 始终加载第一页
      limit: 9999, // 获取所有照片
    };

    const res: any = await request.get("/photos", { params });

    if (res?.success) {
      const newPhotos = res.data.photos.map((p: Photo) => {
        const photo = {
          ...p,
          loaded: false,
          thumbHash: p.thumbHash || p.thumbnailHash,
          originalUrl: getAssetURL(p.originalUrl),
          videoUrl: p.videoUrl ? getAssetURL(p.videoUrl) : undefined,
        };
        return photo;
      });

      photos.value = newPhotos;

      Object.assign(pagination, res.data.pagination);
      hasMore.value = false; // 全量加载不需要加载更多
    }
  } catch (error: any) {
    // 加载失败
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const viewPhoto = async (photo: Photo) => {
  currentPhoto.value = photo;
  photoDialogVisible.value = true;

  // 拉取完整详情（包含完整 EXIF）
  // try {
  //   const res: any = await request.get(`/photos/${photo._id}`);
  //   if (res?.success && res.data) {
  //     currentPhoto.value = { ...photo, ...res.data };
  //   }
  // } catch {
  //   // 忽略详情加载失败，保留列表数据
  // }
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  loadPhotos();
  window.addEventListener("resize", handleResize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.masonry {
  margin: 0 auto;
}
</style>

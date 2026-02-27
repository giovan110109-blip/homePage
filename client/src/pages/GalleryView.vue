<template>
  <div class="min-h-screen bg-black" ref="containerRef">
    <!-- 居中 loading -->
    <div
      v-if="loading"
      class="min-h-screen w-full py-24 flex flex-col items-center justify-start"
    >
      <Loading />
    </div>
    <div v-else class="w-full h-full">
      <!-- 瀑布流照片墙 -->
      <MasonryWall
        v-if="photos.length > 0"
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
                :image-url="getPhotoOriginalUrl(photo)"
                :video-url="photo.videoUrl"
                :is-live="photo.isLive"
                :thumb-hash="photo.thumbHash || photo.thumbnailHash"
                :width="photo.width"
                :height="photo.height"
                :photo-id="photo._id"
              />
              <LazyImage
                v-else
                :src="getPhotoOriginalUrl(photo)"
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
import Loading from "@/components/ui/Loading.vue";
import request from "@/api/request";
import { getPhotoOriginalUrl } from "@/utils";
import { useLivePhotoCache } from "@/composables/useLivePhotoCache";
import type { Photo } from "@/types/api";

interface PhotoWithLoaded extends Photo {
  loaded?: boolean;
}

const photos = ref<PhotoWithLoaded[]>([]);
const loading = ref(false);
const photoDialogVisible = ref(false);
const currentPhoto = ref<PhotoWithLoaded | null>(null);
const containerRef = ref<HTMLElement | null>(null);

const { preloadVideosInViewport } = useLivePhotoCache();

const windowWidth = ref(window.innerWidth);

const gridConfig = computed(() => {
  const width = windowWidth.value;

  if (width < 640) {
    return { columnWidth: 160, minColumns: 2, maxColumns: 2, gap: 6 };
  }
  if (width < 1024) {
    return { columnWidth: 240, minColumns: 3, maxColumns: 4, gap: 8 };
  }
  if (width < 1536) {
    return { columnWidth: 300, minColumns: 4, maxColumns: 5, gap: 10 };
  }
  return { columnWidth: 360, minColumns: 5, maxColumns: 6, gap: 10 };
});

const columnWidth = computed(() => gridConfig.value.columnWidth);
const minColumns = computed(() => gridConfig.value.minColumns);
const maxColumns = computed(() => gridConfig.value.maxColumns);
const gridGap = computed(() => gridConfig.value.gap);

const isMobile = computed(() => {
  return windowWidth.value < 768;
});

const formattedDateCache = new Map<string, string>();

const formatDate = (date: string): string => {
  if (formattedDateCache.has(date)) {
    return formattedDateCache.get(date)!;
  }

  const formatted = new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  formattedDateCache.set(date, formatted);
  return formatted;
};

const keyMapper = (item: PhotoWithLoaded) => item._id;

const loadPhotos = async () => {
  loading.value = true;
  formattedDateCache.clear();

  try {
    const params: any = {
      limit: 10000,
      visibility: "public",
    };

    const res: any = await request.get("/photos", { params });

    if (res?.data) {
      photos.value = res.data.photos
        .map((p: Photo) => {
          const photo = {
            ...p,
            loaded: false,
            thumbHash: p.thumbHash || p.thumbnailHash,
            originalUrl: p.originalUrl,
            videoUrl: p.videoUrl ? p.videoUrl : undefined,
          };
          return photo;
        })
        .sort((a: PhotoWithLoaded, b: PhotoWithLoaded) => {
          return (
            new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()
          );
        });

      if (photos.value.length > 0) {
        const livePhotos = photos.value
          .filter((p: PhotoWithLoaded) => p.isLive && p.videoUrl)
          .map((p: PhotoWithLoaded) => ({
            id: p._id,
            videoUrl: p.videoUrl,
            isVisible: false,
          }));

        if (livePhotos.length > 0) {
          console.log(`📷 预加载 ${livePhotos.length} 个 LivePhoto 视频...`);
          preloadVideosInViewport(livePhotos, {
            maxConcurrent: 1,
            prioritizeVisible: false,
            prefetchDistance: 2,
          }).catch((err) => {
            console.warn("⚠️ LivePhoto 预加载出错:", err);
          });
        }
      }
    }
  } catch (error: any) {
    console.error("加载照片失败:", error);
  } finally {
    loading.value = false;
  }
};

const viewPhoto = async (photo: Photo) => {
  currentPhoto.value = photo;
  photoDialogVisible.value = true;
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

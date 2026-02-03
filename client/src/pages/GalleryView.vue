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
      :hasMore="hasMore"
      :loadingMore="loadingMore"
      @update:modelValue="photoDialogVisible = $event"
      @loadMore="loadPhotos(false)"
    />
  </div>
</template>

<script setup lang="ts">
import { MapPin } from "lucide-vue-next";
import MasonryWall from "@yeger/vue-masonry-wall";
import request from "@/api/request";
import { getAssetURL } from "@/utils";
import { useLivePhotoCache } from "@/composables/useLivePhotoCache";
import type { Photo } from "@/types/api";

interface PhotoWithLoaded extends Photo {
  loaded?: boolean;
}

const photos = ref<PhotoWithLoaded[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const photoDialogVisible = ref(false);
const currentPhoto = ref<PhotoWithLoaded | null>(null);

// LivePhoto 预加载
const { preloadVideosInViewport } = useLivePhotoCache();

const windowWidth = ref(window.innerWidth);

// ✅ 性能优化：合并响应式计算
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

// 检测是否是移动端
const isMobile = computed(() => {
  return windowWidth.value < 768;
});

// ✅ 性能优化：缓存格式化日期结果
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

const pagination = reactive({
  page: 1,
  limit: 50, // ✅ 优化：改为分页加载，首页50张
  total: 0,
  pages: 1,
});

const hasMore = ref(false);

const loadPhotos = async (reset = true) => {
  if (reset) {
    pagination.page = 1;
    photos.value = [];
    formattedDateCache.clear(); // ✅ 清空日期缓存
  }

  loading.value = reset;
  loadingMore.value = !reset;

  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit, // ✅ 分页加载
    };

    const res: any = await request.get("/photos", { params });

    if (res?.success) {
      const newPhotos = res.data.photos.map((p: Photo) => {
        const photo = {
          ...p,
          loaded: false,
          thumbHash: p.thumbHash || p.thumbnailHash,
          originalUrl: p.originalUrl,
          videoUrl: p.videoUrl ? p.videoUrl : undefined,
        };
        return photo;
      });

      if (reset) {
        photos.value = newPhotos;
      } else {
        photos.value.push(...newPhotos);
      }

      Object.assign(pagination, res.data.pagination);
      hasMore.value = pagination.page < pagination.pages;

      // ✅ 优化：只预加载当前页的 LivePhoto，不预加载所有页
      const livePhotos = newPhotos
        .filter((p: PhotoWithLoaded) => p.isLive && p.videoUrl)
        .map((p: PhotoWithLoaded) => ({
          id: p._id,
          videoUrl: p.videoUrl,
          isVisible: false,
        }));

      if (livePhotos.length > 0) {
        console.log(
          `📷 预加载第 ${pagination.page} 页的 ${livePhotos.length} 个 LivePhoto 视频...`,
        );
        // ✅ 优化：使用更保守的并发数
        preloadVideosInViewport(livePhotos, {
          maxConcurrent: 1, // 瀑布流场景用 1，避免占用过多网络
          prioritizeVisible: false, // 瀑布流都在视口外，不需要优先
          prefetchDistance: 2,
        }).catch((err) => {
          console.warn("⚠️ LivePhoto 预加载出错:", err);
        });
      }
    }
  } catch (error: any) {
    console.error("加载照片失败:", error);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
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

// ✅ 优化：实现无限滚动加载
const handleScroll = async () => {
  if (loading.value || loadingMore.value || !hasMore.value) return;

  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;

  // 距离底部 300px 时触发加载
  if (docHeight - scrollTop - windowHeight < 300) {
    pagination.page++;
    await loadPhotos(false);
  }
};

onMounted(() => {
  loadPhotos();
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.masonry {
  margin: 0 auto;
}
</style>

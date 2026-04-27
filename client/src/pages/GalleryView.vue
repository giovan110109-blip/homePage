<template>
  <div class="theme-page min-h-screen" ref="containerRef">
    <Teleport to="body">
      <div
        v-show="showViewportSummary"
        class="pointer-events-none fixed z-[45]"
        style="
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 4rem + 12px);
          left: 16px;
          width: min(calc(100vw - 32px), 560px);
        "
      >
        <div
          class="rounded-[1.6rem] border border-white/24 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] px-4 py-3 text-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] ring-1 ring-white/14 backdrop-blur-[30px] sm:px-5 sm:py-3.5"
        >
          <div class="flex flex-col gap-2.5">
            <div
              v-if="viewportDateRangeText"
              class="flex min-w-0 items-center gap-3 rounded-2xl border border-white/14 bg-white/8 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/14 text-white/78"
              >
                <CalendarRange class="h-4 w-4" />
              </div>
              <div class="min-w-0 truncate text-[15px] font-semibold leading-6 text-white/94 sm:text-[17px]">
                {{ viewportDateRangeText }}
              </div>
            </div>

            <div
              v-if="viewportLocationText"
              class="flex min-w-0 items-center gap-3 rounded-2xl border border-white/14 bg-white/8 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/14 text-white/76"
              >
                <MapPin class="h-4 w-4" />
              </div>
              <div class="min-w-0 truncate text-[15px] font-medium leading-6 text-white/88 sm:text-[17px]">
                {{ viewportLocationText }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 居中 loading -->
    <div
      v-if="showInitialLoading"
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
          <div
            :data-photo-id="photo._id"
            class="group cursor-pointer"
            @click="viewPhoto(photo)"
          >
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
      <div v-if="loadingMore" class="flex justify-center py-8">
        <Loading />
      </div>
    </div>

    <!-- 照片查看器 -->
    <PhotoViewer
      :modelValue="photoDialogVisible"
      :photos="viewerPhotos"
      :currentPhoto="currentPhoto"
      :hasMore="hasMore"
      :loadingMore="loadingMore"
      @loadMore="handleLoadMore"
      @indexChange="handleViewerIndexChange"
      @update:modelValue="($event) => ($event ? (photoDialogVisible = true) : closePhotoViewer())"
    />
  </div>
</template>

<script setup lang="ts">
import { CalendarRange, MapPin } from "lucide-vue-next";
import MasonryWall from "@yeger/vue-masonry-wall";
import { useRoute, useRouter } from "vue-router";
import Loading from "@/components/ui/Loading.vue";
import request from "@/api/request";
import { APP_CONFIG } from "@/config";
import { useLivePhotoCache } from "@/composables/useLivePhotoCache";
import { fetchPhotoDetail, setCachedPhotoDetail } from "@/composables/usePhotoDetailCache";
import { usePagination } from "@/composables/usePagination";
import { useSeo } from "@/composables/useSeo";
import { formatDate as formatDateUtil, formatDateShort } from "@/utils/format";
import { getPhotoOriginalUrl } from "@/utils";
import type { Photo } from "@/types/api";

interface PhotoWithLoaded extends Photo {
  loaded?: boolean;
}

const photoDialogVisible = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const currentPhotoId = ref<string | null>(null);
const standalonePhoto = ref<PhotoWithLoaded | null>(null);
const visiblePhotoIds = ref<Set<string>>(new Set());
const scrolledBeyondTop = ref(false);
const summaryPhotos = ref<PhotoWithLoaded[]>([]);
const { suspendPreloads, resumePreloads } = useLivePhotoCache();
const route = useRoute();
const router = useRouter();
let visibilityFrame: number | null = null;
let resumePreloadTimer: number | null = null;
let routeSyncVersion = 0;
const LIVE_PHOTO_PRELOAD_RESUME_DELAY = 250;

const {
  data: photos,
  loading,
  loadingMore,
  hasMore,
  fetch,
  loadMore,
} = usePagination<PhotoWithLoaded>({
  fetcher: async (page, pageSize) => {
    const res: any = await request.get("/photos", {
      params: {
        page,
        limit: pageSize,
        visibility: "public",
        sortBy: "dateTaken",
        sortOrder: "desc",
      },
    });

    const payload = res?.data || {};
    const pagination = payload.pagination || {};

    return {
      data: Array.isArray(payload.photos)
        ? payload.photos.map((photo: Photo) => ({
            ...photo,
            loaded: false,
            thumbHash: photo.thumbHash || photo.thumbnailHash,
            originalUrl: photo.originalUrl,
            videoUrl: photo.videoUrl || undefined,
          }))
        : [],
      meta: {
        page: pagination.page || page,
        pageSize: pagination.limit || pageSize,
        total: pagination.total || 0,
        pageCount: pagination.totalPages || pagination.pages || 1,
      },
    };
  },
  pageSize: APP_CONFIG.gallery.pageSize,
});

const windowWidth = ref(window.innerWidth);
const showInitialLoading = computed(() => loading.value && photos.value.length === 0);

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

const formattedDateCache = new Map<string, string>();
const currentPhoto = computed(() => {
  if (!currentPhotoId.value) return null;

  if (standalonePhoto.value?._id === currentPhotoId.value) {
    const listPhoto = photos.value.find(
      (photo) => photo._id === currentPhotoId.value,
    );

    return listPhoto
      ? { ...listPhoto, ...standalonePhoto.value }
      : standalonePhoto.value;
  }

  return photos.value.find((photo) => photo._id === currentPhotoId.value) || null;
});
const currentPhotoTitle = computed(() => {
  if (!currentPhoto.value?._id) return "相册";
  return currentPhoto.value.title || "照片详情";
});
const currentPhotoDescription = computed(() => {
  if (!currentPhoto.value?._id) {
    return "浏览 Giovan 的照片相册";
  }

  const location =
    currentPhoto.value.geoinfo?.city ||
    currentPhoto.value.geoinfo?.region ||
    currentPhoto.value.geoinfo?.country ||
    "";
  const date = currentPhoto.value.dateTaken
    ? formatDateShort(currentPhoto.value.dateTaken).replace(/\//g, "-")
    : "";
  const summary = [
    currentPhoto.value.description || "",
    [date, location].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join(" | ");

  return summary || "查看这张照片的拍摄信息与分享卡片";
});
const currentPhotoSeoImage = computed(() => {
  if (typeof window === "undefined" || !currentPhoto.value?._id) {
    return "";
  }
  return `${window.location.origin}/api/photos/${currentPhoto.value._id}/share-image`;
});
const currentPhotoShareUrl = computed(() => {
  if (typeof window === "undefined" || !currentPhoto.value?._id) {
    return "";
  }
  return `${window.location.origin}/api/photos/${currentPhoto.value._id}/share`;
});

useSeo({
  title: currentPhotoTitle,
  description: currentPhotoDescription,
  image: currentPhotoSeoImage,
  url: currentPhotoShareUrl,
  type: "website",
});
const viewerPhotos = computed(() => {
  if (!standalonePhoto.value) {
    return photos.value;
  }

  const existsInList = photos.value.some(
    (photo) => photo._id === standalonePhoto.value?._id,
  );

  return existsInList
    ? photos.value
    : [standalonePhoto.value, ...photos.value];
});
const summaryDisplayPhotos = computed(() => {
  if (summaryPhotos.value.length > 0) {
    return summaryPhotos.value;
  }

  return photos.value.slice(0, Math.min(12, photos.value.length));
});
const visiblePhotos = computed(() => {
  if (visiblePhotoIds.value.size === 0) return [];
  return photos.value.filter((photo) => visiblePhotoIds.value.has(photo._id));
});
const viewportDateRangeText = computed(() => {
  const timestamps = summaryDisplayPhotos.value
    .map((photo) => {
      const value = new Date(photo.dateTaken).getTime();
      return Number.isFinite(value) ? value : null;
    })
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (timestamps.length === 0) return "";

  const start = formatViewportDate(timestamps[0]);
  const end = formatViewportDate(timestamps[timestamps.length - 1]);

  return start === end ? start : `${start} 到 ${end}`;
});
const viewportLocationText = computed(() => {
  const locationMeta = new Map<string, { count: number; firstIndex: number }>();

  summaryDisplayPhotos.value.forEach((photo, index) => {
    const label = getPhotoLocationLabel(photo);
    if (!label) return;

    const existing = locationMeta.get(label);
    if (existing) {
      existing.count += 1;
      return;
    }

    locationMeta.set(label, { count: 1, firstIndex: index });
  });

  if (locationMeta.size === 0) return "";

  const sortedLocations = Array.from(locationMeta.entries())
    .sort((a, b) => {
      if (b[1].count !== a[1].count) {
        return b[1].count - a[1].count;
      }
      return a[1].firstIndex - b[1].firstIndex;
    })
    .map(([label]) => label);

  const topLocations = sortedLocations.slice(0, 4);
  if (sortedLocations.length <= topLocations.length) {
    return topLocations.join(" · ");
  }

  return `${topLocations.join(" · ")} 等 ${sortedLocations.length} 地`;
});
const showViewportSummary = computed(() => {
  return (
    scrolledBeyondTop.value &&
    photos.value.length > 0 &&
    Boolean(viewportDateRangeText.value || viewportLocationText.value)
  );
});

const formatDate = (date: string): string => {
  if (formattedDateCache.has(date)) {
    return formattedDateCache.get(date)!;
  }

  const formatted = formatDateUtil(date);
  formattedDateCache.set(date, formatted);
  return formatted;
};

const keyMapper = (item: PhotoWithLoaded) => item._id;

const syncVisiblePhotos = () => {
  if (typeof window === "undefined") return;

  visibilityFrame = null;

  const viewportHeight = window.innerHeight;
  const nextVisiblePhotoIds = new Set<string>();
  const photoElements = containerRef.value?.querySelectorAll<HTMLElement>(
    "[data-photo-id]",
  );

  if (!photoElements?.length) {
    if (!scrolledBeyondTop.value) {
      visiblePhotoIds.value = nextVisiblePhotoIds;
      summaryPhotos.value = [];
    }
    return;
  }

  for (const element of photoElements) {
    const photoId = element.dataset.photoId;
    if (!photoId) continue;

    const rect = element.getBoundingClientRect();
    const visibleHeight =
      Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    const isVisible = visibleHeight > Math.min(120, rect.height * 0.12);

    if (isVisible) {
      nextVisiblePhotoIds.add(photoId);
    }
  }

  const currentIds = visiblePhotoIds.value;
  const hasSameSize = currentIds.size === nextVisiblePhotoIds.size;
  const hasSameValues =
    hasSameSize &&
    Array.from(nextVisiblePhotoIds).every((photoId) => currentIds.has(photoId));

  if (nextVisiblePhotoIds.size > 0) {
    if (!hasSameValues) {
      visiblePhotoIds.value = nextVisiblePhotoIds;
    }

    summaryPhotos.value = photos.value.filter((photo) =>
      nextVisiblePhotoIds.has(photo._id),
    );
    return;
  }

  if (!scrolledBeyondTop.value) {
    visiblePhotoIds.value = nextVisiblePhotoIds;
    summaryPhotos.value = [];
  }
};

const scheduleVisiblePhotoSync = () => {
  if (typeof window === "undefined") return;
  if (visibilityFrame !== null) return;

  visibilityFrame = window.requestAnimationFrame(() => {
    syncVisiblePhotos();
  });
};

const formatViewportDate = (timestamp: number) => {
  const formatted = formatDateShort(new Date(timestamp));
  return formatted.replace(/\//g, "-");
};

const getPhotoLocationLabel = (photo: PhotoWithLoaded) => {
  return (
    photo.geoinfo?.city ||
    photo.geoinfo?.region ||
    photo.geoinfo?.country ||
    photo.geoinfo?.locationName ||
    ""
  );
};

const handleLoadMore = async () => {
  if (!hasMore.value || loading.value || loadingMore.value) return;

  suspendPreloads();

  if (resumePreloadTimer !== null) {
    window.clearTimeout(resumePreloadTimer);
    resumePreloadTimer = null;
  }

  try {
    await loadMore();
  } catch {
    // ignore
  } finally {
    resumePreloadTimer = window.setTimeout(() => {
      resumePreloads();
      resumePreloadTimer = null;
    }, LIVE_PHOTO_PRELOAD_RESUME_DELAY);
  }
};

const handleScroll = () => {
  if (typeof document === "undefined") return;

  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  scrolledBeyondTop.value = scrollTop > 56;
  scheduleVisiblePhotoSync();
  if (
    scrollHeight - scrollTop - clientHeight <
    APP_CONFIG.gallery.loadMoreThreshold
  ) {
    void handleLoadMore();
  }
};

const loadPhotos = async () => {
  formattedDateCache.clear();

  try {
    await fetch();
  } catch {
    // ignore
  }
};

const createRoutePlaceholderPhoto = (photoId: string): PhotoWithLoaded => ({
  _id: photoId,
  title: "",
  description: "",
  originalUrl: "",
  width: 1,
  height: 1,
  dateTaken: "",
  loaded: false,
});

const updateGalleryRoute = async (photoId: string | null) => {
  const nextQuery = { ...route.query };

  if (photoId) {
    nextQuery.photoId = photoId;
  } else {
    delete nextQuery.photoId;
  }

  routeSyncVersion += 1;
  const currentSyncVersion = routeSyncVersion;

  await router.replace({
    name: "gallery",
    query: nextQuery,
  });

  if (currentSyncVersion === routeSyncVersion) {
    return;
  }
};

const viewPhoto = async (photo: Photo) => {
  standalonePhoto.value = null;
  currentPhotoId.value = photo._id;
  photoDialogVisible.value = true;
  await updateGalleryRoute(photo._id);
};

const closePhotoViewer = async () => {
  photoDialogVisible.value = false;
  currentPhotoId.value = null;
  standalonePhoto.value = null;
  await updateGalleryRoute(null);
};

const handleViewerIndexChange = async (index: number) => {
  const nextPhoto = viewerPhotos.value[index];
  if (!nextPhoto?._id) return;
  if (nextPhoto._id === currentPhotoId.value && !standalonePhoto.value) return;

  standalonePhoto.value =
    standalonePhoto.value?._id === nextPhoto._id ? standalonePhoto.value : null;
  currentPhotoId.value = nextPhoto._id;
  await updateGalleryRoute(nextPhoto._id);
};

const syncViewerWithRoute = async () => {
  const rawPhotoId = Array.isArray(route.query.photoId)
    ? route.query.photoId[0]
    : route.query.photoId;
  const routePhotoId = typeof rawPhotoId === "string" && rawPhotoId ? rawPhotoId : null;

  if (!routePhotoId) {
    if (photoDialogVisible.value || currentPhotoId.value || standalonePhoto.value) {
      photoDialogVisible.value = false;
      currentPhotoId.value = null;
      standalonePhoto.value = null;
    }
    return;
  }

  const existingPhoto =
    photos.value.find((photo) => photo._id === routePhotoId) || null;

  if (existingPhoto) {
    standalonePhoto.value = null;
    currentPhotoId.value = routePhotoId;
    photoDialogVisible.value = true;
    return;
  }

  currentPhotoId.value = routePhotoId;
  photoDialogVisible.value = true;

  if (standalonePhoto.value?._id !== routePhotoId) {
    standalonePhoto.value = createRoutePlaceholderPhoto(routePhotoId);
  }

  try {
    const detailPhoto = (await fetchPhotoDetail({ _id: routePhotoId })) as PhotoWithLoaded;
    const normalizedPhoto: PhotoWithLoaded = {
      ...detailPhoto,
      loaded: false,
      thumbHash: detailPhoto.thumbHash || detailPhoto.thumbnailHash,
      originalUrl: detailPhoto.originalUrl,
      videoUrl: detailPhoto.videoUrl || undefined,
    };

    standalonePhoto.value = normalizedPhoto;
    currentPhotoId.value = routePhotoId;
    photoDialogVisible.value = true;
    setCachedPhotoDetail(routePhotoId, normalizedPhoto);
  } catch (error) {
    console.error("Failed to open photo from route:", error);
    await closePhotoViewer();
  }
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  scheduleVisiblePhotoSync();
};

onMounted(() => {
  resumePreloads();
  loadPhotos();
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
  void syncViewerWithRoute();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("scroll", handleScroll);
  if (resumePreloadTimer !== null) {
    window.clearTimeout(resumePreloadTimer);
    resumePreloadTimer = null;
  }
  resumePreloads();
  if (visibilityFrame !== null) {
    window.cancelAnimationFrame(visibilityFrame);
    visibilityFrame = null;
  }
  visiblePhotoIds.value = new Set();
  summaryPhotos.value = [];
});

watch(
  () => photos.value.length,
  () => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      handleScroll();
      scheduleVisiblePhotoSync();
    });
    void syncViewerWithRoute();
  },
  { flush: "post" },
);

watch(
  () => route.query.photoId,
  () => {
    void syncViewerWithRoute();
  },
);
</script>

<style scoped>
.masonry {
  margin: 0 auto;
}

</style>

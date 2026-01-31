<template>
  <div class="min-h-screen bg-black">
    <div class="w-full h-full">
      <!-- 瀑布流照片墙 -->
      <MasonryWall
        v-if="!loading && photos.length > 0"
        :items="photos"
        :column-width="columnWidth"
        :gap="8"
        class="masonry p-1 sm:p-2"
      >
        <template #default="{ item: photo }">
          <div
            class="group cursor-pointer"
            @click="viewPhoto(photo)"
          >
            <div class="relative overflow-hidden rounded-sm shadow-lg  transition-all bg-gray-900 ">
              <LivePhoto
                v-if="photo.isLive"
                :image-url="photo.originalUrl"
                :video-url="photo.videoUrl"
                :is-live="photo.isLive"
                :thumb-hash="photo.thumbHash || photo.thumbnailHash"
                :width="photo.width"
                :height="photo.height"
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
                <h3 class="text-white font-medium text-xs sm:text-sm line-clamp-1">{{ photo.title }}</h3>
                <p class="text-gray-300 text-xs hidden sm:block">{{ formatDate(photo.dateTaken) }}</p>
                <div v-if="photo.geoinfo?.city" class="flex items-center gap-1 text-gray-400 text-xs mt-1">
                  <MapPin class="w-3 h-3" />
                  {{ photo.geoinfo.city }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </MasonryWall>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center items-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="flex justify-center py-8">
        <el-button
          type="primary"
          size="large"
          :loading="loadingMore"
          @click="loadMorePhotos"
          class="bg-white/10 hover:bg-white/20 border-white/20 text-white"
        >
          加载更多
        </el-button>
      </div>
    </div>

    <!-- 照片详情对话框 -->
    <el-dialog
      v-model="photoDialogVisible"
      :title="currentPhoto?.title"
      :width="isMobile ? '100%' : '95%'"
      :fullscreen="isMobile"
      :style="{ maxWidth: isMobile ? 'none' : '1200px' }"
      class="photo-detail-dialog"
    >
      <div v-if="currentPhoto" class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <!-- 图片 -->
        <div class="lg:col-span-2">
          <img
            :src="currentPhoto.originalUrl"
            :alt="currentPhoto.title"
            class="w-full rounded-lg shadow-lg"
          />
        </div>

        <!-- 信息 -->
        <div class="space-y-4 sm:space-y-6">
          <!-- 基本信息 -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <Info class="w-5 h-5" />
              基本信息
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">尺寸</span>
                <span>{{ currentPhoto.width }} × {{ currentPhoto.height }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">拍摄时间</span>
                <span>{{ formatDate(currentPhoto.dateTaken) }}</span>
              </div>
              <div v-if="currentPhoto.tags?.length" class="flex flex-wrap gap-1 mt-2">
                <el-tag v-for="tag in currentPhoto.tags" :key="tag" size="small">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 相机信息 -->
          <div v-if="currentPhoto.camera" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <Camera class="w-5 h-5" />
              相机信息
            </h3>
            <div class="space-y-2 text-sm">
              <div v-if="currentPhoto.camera.make" class="flex justify-between">
                <span class="text-gray-500">品牌</span>
                <span>{{ currentPhoto.camera.make }}</span>
              </div>
              <div v-if="currentPhoto.camera.model" class="flex justify-between">
                <span class="text-gray-500">型号</span>
                <span>{{ currentPhoto.camera.model }}</span>
              </div>
              <div v-if="currentPhoto.camera.lens" class="flex justify-between">
                <span class="text-gray-500">镜头</span>
                <span>{{ currentPhoto.camera.lens }}</span>
              </div>
            </div>
          </div>

          <!-- EXIF信息 -->
          <div v-if="exifItems.length" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <Settings class="w-5 h-5" />
              拍摄参数
            </h3>
            <div class="space-y-2 text-sm">
              <div v-for="item in exifItems" :key="item.label" class="flex justify-between">
                <span class="text-gray-500">{{ item.label }}</span>
                <span>{{ item.value }}</span>
              </div>
            </div>
          </div>

          <!-- 位置信息 -->
          <div v-if="currentPhoto.location" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <MapPin class="w-5 h-5" />
              位置信息
            </h3>
            <div class="space-y-2 text-sm">
              <div v-if="currentPhoto.geoinfo?.formatted">
                <p class="text-gray-700 dark:text-gray-300">{{ currentPhoto.geoinfo.formatted }}</p>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">坐标</span>
                <span class="font-mono text-xs">
                  {{ currentPhoto.location.latitude.toFixed(6) }},
                  {{ currentPhoto.location.longitude.toFixed(6) }}
                </span>
              </div>
            </div>
            
            <!-- 地图 -->
            <div class="mt-3 h-40 sm:h-48">
              <PhotoLocationMap
                :latitude="currentPhoto.location.latitude"
                :longitude="currentPhoto.location.longitude"
                :zoom="14"
              />
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ImageIcon, MapPin, Info, Camera, Settings } from 'lucide-vue-next'
import MasonryWall from '@yeger/vue-masonry-wall'
import request from '@/api/request'
import { getAssetURL } from '@/utils'
import LazyImage from '@/components/LazyImage.vue'
import LivePhoto from '@/components/LivePhoto.vue'
import PhotoLocationMap from '@/components/PhotoLocationMap.vue'
import type { Photo } from '@/types/api'

interface PhotoWithLoaded extends Photo {
  loaded?: boolean
}

const photos = ref<PhotoWithLoaded[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const photoDialogVisible = ref(false)
const currentPhoto = ref<PhotoWithLoaded | null>(null)

// 检测是否是移动端
const isMobile = computed(() => {
  return window.innerWidth < 768
})

// 响应式列宽
const columnWidth = computed(() => {
  const width = window.innerWidth
  if (width < 640) return 150      // 手机：2-3列
  if (width < 1024) return 250     // 平板：3-4列
  if (width < 1536) return 320     // 小屏PC：4-5列
  return 380                        // 大屏PC：5-6列
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 1
})

const hasMore = ref(false)

const loadPhotos = async (reset = true) => {
  if (reset) {
    pagination.page = 1
    photos.value = []
  }

  loading.value = reset
  loadingMore.value = !reset

  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit
    }

    const res: any = await request.get('/photos', { params })

    if (res?.success) {
      const newPhotos = res.data.photos.map((p: Photo) => {
        const photo = {
          ...p,
          loaded: false,
          thumbHash: p.thumbHash || p.thumbnailHash,
          originalUrl: getAssetURL(p.originalUrl),
          videoUrl: p.videoUrl ? getAssetURL(p.videoUrl) : undefined
        }
        return photo
      })
      
      
      if (reset) {
        photos.value = newPhotos
      } else {
        photos.value.push(...newPhotos)
      }

      Object.assign(pagination, res.data.pagination)
      hasMore.value = pagination.page < pagination.pages
    }
  } catch (error: any) {
    // 加载失败
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMorePhotos = () => {
  pagination.page++
  loadPhotos(false)
}

const viewPhoto = async (photo: Photo) => {
  currentPhoto.value = photo
  photoDialogVisible.value = true

  // 拉取完整详情（包含完整 EXIF）
  try {
    const res: any = await request.get(`/photos/${photo._id}`)
    if (res?.success && res.data) {
      currentPhoto.value = { ...photo, ...res.data }
    }
  } catch {
    // 忽略详情加载失败，保留列表数据
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getExifValue = (exif: any, key: string) => {
  if (!exif) return undefined
  return exif[key] ?? exif[key.toLowerCase()] ?? exif[key.toUpperCase()]
}

const exifItems = computed(() => {
  const exif = currentPhoto.value?.exif
  if (!exif) return []

  const items = [
    { label: '曝光时间', value: getExifValue(exif, 'ExposureTime') },
    { label: '曝光补偿', value: getExifValue(exif, 'ExposureCompensation') ?? getExifValue(exif, 'ExposureBiasValue') },
    { label: '光圈', value: getExifValue(exif, 'FNumber') ?? getExifValue(exif, 'ApertureValue') },
    { label: 'ISO', value: getExifValue(exif, 'ISO') },
    { label: '焦距', value: getExifValue(exif, 'FocalLength') },
    { label: '等效焦距', value: getExifValue(exif, 'FocalLengthIn35mmFormat') },
    { label: '测光模式', value: getExifValue(exif, 'MeteringMode') },
    { label: '白平衡', value: getExifValue(exif, 'WhiteBalance') },
    { label: '闪光灯', value: getExifValue(exif, 'Flash') },
    { label: '曝光程序', value: getExifValue(exif, 'ExposureProgram') },
    { label: '镜头', value: getExifValue(exif, 'LensModel') },
  ]

  return items.filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
})

onMounted(() => {
  loadPhotos()
})
</script>

<style scoped>
.photo-detail-dialog :deep(.el-dialog__body) {
  padding: 1.5rem;
}
</style>

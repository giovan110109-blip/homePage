<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">说说管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        发布和管理说说动态
      </p>
    </div>

    <el-card
      shadow="never"
      class="flex-1 min-h-0 flex flex-col !border-0 !rounded-xl !bg-white dark:!bg-slate-800 !shadow-md"
      :body-style="{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
      }"
    >
      <div class="flex-1 min-h-0 overflow-auto">
        <el-tabs v-model="activeTab" class="mb-2">
          <el-tab-pane label="发布说说" name="create">
            <div class="max-w-3xl mx-auto space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  内容
                </label>
                <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="4"
                  placeholder="分享你的想法..."
                  maxlength="500"
                  show-word-limit
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  模式
                </label>
                <el-radio-group v-model="form.mode" :disabled="form.media.length > 0 || form.video">
                  <el-radio value="livePhoto">
                    <div class="flex items-center gap-2">
                      <Camera class="w-4 h-4" />
                      <span>Live Photo 模式</span>
                    </div>
                  </el-radio>
                  <el-radio value="video">
                    <div class="flex items-center gap-2">
                      <Video class="w-4 h-4" />
                      <span>视频模式</span>
                    </div>
                  </el-radio>
                </el-radio-group>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Live Photo 模式：上传图片/视频走画廊处理逻辑，支持自动识别 Live 图<br/>
                  视频模式：直接上传视频文件，不经过画廊处理
                </p>
              </div>

              <div v-if="form.mode === 'livePhoto'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  图片/视频（走画廊逻辑，设为私密）
                </label>
                
                <div class="flex gap-3 mb-4">
                  <AppButton variant="secondary" size="sm" @click="showGalleryPicker = true">
                    <Image class="w-4 h-4 mr-1" />
                    从画廊选择
                  </AppButton>
                  <AppButton variant="secondary" size="sm" @click="uploadInput?.click()">
                    <Upload class="w-4 h-4 mr-1" />
                    上传图片
                  </AppButton>
                  <input
                    ref="uploadInput"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    class="hidden"
                    @change="handleFileUpload"
                  />
                </div>

                <div v-if="form.media.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <div
                    v-for="(item, index) in form.media"
                    :key="index"
                    class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group"
                  >
                    <img
                      v-if="!item.isVideo"
                      :src="item.url"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600"
                    >
                      <Video class="w-8 h-8 text-gray-400" />
                    </div>
                    <button
                      @click="removeMedia(index)"
                      class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X class="w-4 h-4" />
                    </button>
                    <div
                      v-if="item.isLive"
                      class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-xs"
                    >
                      LIVE
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="form.mode === 'video'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  视频（直接上传）
                </label>
                
                <div class="flex gap-3 mb-4">
                  <AppButton variant="secondary" size="sm" @click="videoInput?.click()">
                    <Upload class="w-4 h-4 mr-1" />
                    上传视频
                  </AppButton>
                  <input
                    ref="videoInput"
                    type="file"
                    accept="video/*"
                    class="hidden"
                    @change="handleVideoUpload"
                  />
                </div>

                <div v-if="form.video" class="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <video
                    :src="form.video.url"
                    controls
                    class="w-full max-h-[300px] object-contain"
                  />
                  <button
                    @click="removeVideo"
                    class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>

                <div v-if="videoUploading" class="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ videoUploadName }}</span>
                      <span class="text-xs text-gray-500">{{ videoUploadProgress }}%</span>
                    </div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-blue-500 transition-all duration-300"
                        :style="{ width: `${videoUploadProgress}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  位置
                </label>
                <div class="flex gap-3">
                  <el-input
                    v-model="form.location.name"
                    placeholder="点击获取当前位置"
                    readonly
                    class="flex-1"
                  >
                    <template #prefix>
                      <MapPin class="w-4 h-4 text-gray-400" />
                    </template>
                  </el-input>
                  <AppButton
                    variant="secondary"
                    :loading="locationLoading"
                    @click="getCurrentLocation"
                  >
                    <Navigation class="w-4 h-4 mr-1" />
                    获取位置
                  </AppButton>
                </div>
                <p v-if="form.location.address" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ form.location.address }}
                </p>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <AppButton variant="secondary" @click="resetForm">重置</AppButton>
                <AppButton
                  variant="primary"
                  :loading="submitting"
                  :disabled="!canSubmit"
                  @click="handleSubmit"
                >
                  发布说说
                </AppButton>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="说说列表" name="list">
            <div v-if="loading" class="text-center py-12">
              <Loading />
            </div>

            <div v-else-if="moments.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无说说
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="moment in moments"
                :key="moment._id"
                class="p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-gray-900 dark:text-white whitespace-pre-wrap text-sm sm:text-base line-clamp-3">{{ moment.content }}</p>
                    <div class="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{{ formatDate(moment.createdAt) }}</span>
                      <span v-if="moment.location?.name" class="flex items-center">
                        <MapPin class="w-3 h-3 mr-0.5" />
                        {{ moment.location.name }}
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-xs" :class="{
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': moment.status === 'published',
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': moment.status === 'draft',
                      }">
                        {{ moment.status === 'published' ? '已发布' : '草稿' }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <AppButton variant="ghost" size="sm" @click="editMoment(moment)">
                      <Edit2 class="w-4 h-4" />
                    </AppButton>
                    <AppButton variant="ghost" size="sm" class="text-red-500 hover:text-red-600" @click="deleteMoment(moment._id)">
                      <Trash2 class="w-4 h-4" />
                    </AppButton>
                  </div>
                </div>

                <div v-if="moment.media?.length" class="grid grid-cols-5 sm:grid-cols-6 gap-1.5 mt-3">
                  <div
                    v-for="(item, idx) in moment.media.slice(0, 6)"
                    :key="idx"
                    class="aspect-square rounded overflow-hidden bg-gray-100 dark:bg-gray-700 relative"
                  >
                    <img :src=" item.url" class="w-full h-full object-cover" />
                    <div
                      v-if="item.isLive"
                      class="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded bg-black/50 text-white text-[10px]"
                    >
                      LIVE
                    </div>
                  </div>
                </div>

                <div v-if="moment.livePhoto" class="mt-3">
                  <div class="relative rounded overflow-hidden bg-gray-100 dark:bg-gray-700 w-20 h-20">
                    <img :src="moment.livePhoto.imageUrl" class="w-full h-full object-cover" />
                    <div class="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded bg-black/50 text-white text-[10px]">
                      LIVE
                    </div>
                  </div>
                </div>

                <div v-if="moment.video" class="mt-3">
                  <video :src="moment.video.url" controls class="w-full max-w-[200px] rounded" />
                </div>
              </div>

              <div v-if="pagination.total > pagination.pageSize" class="flex justify-center pt-4">
                <el-pagination
                  v-model:current-page="pagination.page"
                  :page-size="pagination.pageSize"
                  :total="pagination.total"
                  layout="prev, pager, next"
                  small
                  @current-change="loadMoments"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <el-dialog
      v-model="showGalleryPicker"
      title="从画廊选择"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="mb-4">
        <el-input
          v-model="gallerySearch"
          placeholder="搜索图片..."
          clearable
          @input="searchGallery"
        >
          <template #prefix>
            <Search class="w-4 h-4 text-gray-400" />
          </template>
        </el-input>
      </div>

      <div v-if="galleryLoading" class="text-center py-8">
        <Loading />
      </div>

      <div v-else class="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto">
        <div
          v-for="photo in galleryPhotos"
          :key="photo._id"
          class="relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all"
          :class="{
            'ring-2 ring-blue-500': selectedGalleryIds.includes(photo._id),
            'hover:ring-2 hover:ring-gray-300': !selectedGalleryIds.includes(photo._id),
          }"
          @click="toggleGallerySelect(photo)"
        >
          <img
            :src="photo.originalUrl"
            class="w-full h-full object-cover"
          />
          <div
            v-if="selectedGalleryIds.includes(photo._id)"
            class="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
          >
            <Check class="w-6 h-6 text-white" />
          </div>
          <div
            v-if="photo.isLive"
            class="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/50 text-white text-xs"
          >
            LIVE
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">
            已选择 {{ selectedGalleryIds.length }} 张
          </span>
          <div class="flex gap-3">
            <AppButton variant="secondary" @click="showGalleryPicker = false">取消</AppButton>
            <AppButton variant="primary" @click="confirmGallerySelect">确认选择</AppButton>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Camera,
  Video,
  Image,
  Upload,
  X,
  MapPin,
  Navigation,
  Edit2,
  Trash2,
  Search,
  Check,
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppButton from '@/components/ui/AppButton.vue'
import Loading from '@/components/ui/Loading.vue'
import request from '@/api/request'
import { formatDate } from '@/utils/format'
import { useUploadQueueStore } from '@/stores/uploadQueue'

interface MediaItem {
  url: string
  thumbnailUrl?: string
  thumbHash?: string
  width?: number
  height?: number
  photoId?: string
  isPrivate?: boolean
  isVideo?: boolean
  isLive?: boolean
  videoUrl?: string
}

interface GalleryPhoto {
  _id: string
  originalUrl: string
  originalFileUrl?: string
  thumbnailUrl?: string
  thumbnailHash?: string
  isLive?: boolean
  videoUrl?: string
  width?: number
  height?: number
}

const activeTab = ref('create')
const uploadQueue = useUploadQueueStore()

const form = ref({
  content: '',
  mode: 'livePhoto' as 'livePhoto' | 'video',
  media: [] as MediaItem[],
  video: null as { url: string; storageKey: string } | null,
  location: {
    latitude: null as number | null,
    longitude: null as number | null,
    name: '',
    address: '',
  },
})

const loading = ref(false)
const submitting = ref(false)
const moments = ref<any[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
})

const uploadInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const videoUploading = ref(false)
const videoUploadProgress = ref(0)
const videoUploadName = ref('')

const locationLoading = ref(false)

const showGalleryPicker = ref(false)
const galleryLoading = ref(false)
const galleryPhotos = ref<GalleryPhoto[]>([])
const gallerySearch = ref('')
const selectedGalleryIds = ref<string[]>([])

const canSubmit = computed(() => {
  return form.value.content.trim() || form.value.media.length > 0 || form.value.video
})

const resetForm = () => {
  form.value = {
    content: '',
    mode: 'livePhoto',
    media: [],
    video: null,
    location: {
      latitude: null,
      longitude: null,
      name: '',
      address: '',
    },
  }
}

const handleFileUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  const fileArray = Array.from(files)
  uploadQueue.enqueueFiles(fileArray)

  ElMessage.success(`已添加 ${fileArray.length} 个文件到上传队列`)

  if (uploadInput.value) {
    uploadInput.value.value = ''
  }
}

const handleVideoUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  videoUploading.value = true
  videoUploadProgress.value = 0
  videoUploadName.value = file.name

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', 'video')

    const res: any = await request.post('/admin/moments/upload', formData, {
      timeout: 15 * 60 * 1000,
      onUploadProgress: (progressEvent: any) => {
        const total = progressEvent.total || file.size
        videoUploadProgress.value = Math.round((progressEvent.loaded / total) * 100)
      },
    })

    if (res?.success) {
      form.value.video = {
        url: res.data.url,
        storageKey: res.data.storageKey,
      }
      ElMessage.success('视频上传成功')
    } else {
      throw new Error(res?.message || '上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    videoUploading.value = false
    if (videoInput.value) {
      videoInput.value.value = ''
    }
  }
}

const removeMedia = (index: number) => {
  form.value.media.splice(index, 1)
}

const removeVideo = () => {
  form.value.video = null
}

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    ElMessage.warning('您的浏览器不支持地理定位')
    return
  }

  locationLoading.value = true

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    })

    const { latitude, longitude } = position.coords

    const res: any = await request.get('/moments/geocode/reverse', {
      params: { latitude, longitude },
    })

    if (res?.success) {
      form.value.location = {
        latitude,
        longitude,
        name: res.data.name || '',
        address: res.data.address || '',
      }
    }
  } catch (error: any) {
    console.error('获取位置失败:', error)
    ElMessage.error('获取位置失败，请检查定位权限')
  } finally {
    locationLoading.value = false
  }
}

const searchGallery = async () => {
  await loadGalleryPhotos()
}

const loadGalleryPhotos = async () => {
  galleryLoading.value = true
  try {
    const res: any = await request.get('/admin/moments/gallery/photos', {
      params: {
        page: 1,
        limit: 50,
        search: gallerySearch.value || undefined,
      },
    })

    if (res?.success) {
      galleryPhotos.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载画廊失败:', error)
  } finally {
    galleryLoading.value = false
  }
}

const toggleGallerySelect = (photo: GalleryPhoto) => {
  const index = selectedGalleryIds.value.indexOf(photo._id)
  if (index > -1) {
    selectedGalleryIds.value.splice(index, 1)
  } else {
    selectedGalleryIds.value.push(photo._id)
  }
}

const confirmGallerySelect = () => {
  for (const photoId of selectedGalleryIds.value) {
    const photo = galleryPhotos.value.find((p) => p._id === photoId)
    if (photo) {
      form.value.media.push({
        url: photo.originalUrl,
        thumbnailUrl: photo.thumbnailUrl ,
        thumbHash: photo.thumbnailHash,
        width: photo.width,
        height: photo.height,
        photoId: photo._id,
        isPrivate: false,
        isLive: photo.isLive,
        videoUrl: photo.videoUrl,
      })
    }
  }

  selectedGalleryIds.value = []
  showGalleryPicker.value = false
  ElMessage.success('已添加到媒体列表')
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    ElMessage.warning('请输入内容或添加媒体')
    return
  }

  submitting.value = true

  try {
    const data: any = {
      content: form.value.content,
      mode: form.value.mode,
    }

    if (form.value.mode === 'livePhoto' && form.value.media.length > 0) {
      data.media = form.value.media.map((item) => ({
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        thumbHash: item.thumbHash,
        width: item.width,
        height: item.height,
        photoId: item.photoId,
        isPrivate: true,
        isLive: item.isLive || false,
        videoUrl: item.videoUrl || null,
      }))
    }

    if (form.value.mode === 'video' && form.value.video) {
      data.video = {
        url: form.value.video.url,
        storageKey: form.value.video.storageKey,
      }
    }

    if (form.value.location.latitude) {
      data.location = form.value.location
    }

    const res: any = await request.post('/admin/moments', data)

    if (res?.success) {
      ElMessage.success('发布成功')
      resetForm()
      loadMoments()
      activeTab.value = 'list'
    } else {
      throw new Error(res?.message || '发布失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '发布失败')
  } finally {
    submitting.value = false
  }
}

const loadMoments = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/moments/list', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
    })

    if (res?.success) {
      moments.value = res.data.data || []
      pagination.value.total = res.data.meta?.total || 0
    }
  } catch (error) {
    console.error('加载说说列表失败:', error)
  } finally {
    loading.value = false
  }
}

const editMoment = (moment: any) => {
  form.value.content = moment.content || ''
  form.value.mode = moment.mode || 'livePhoto'
  form.value.media = moment.media || []
  form.value.video = moment.video || null
  form.value.location = moment.location || {
    latitude: null,
    longitude: null,
    name: '',
    address: '',
  }
  activeTab.value = 'create'
}

const deleteMoment = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条说说吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res: any = await request.delete(`/admin/moments/${id}`)

    if (res?.success) {
      ElMessage.success('删除成功')
      loadMoments()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}


watch(showGalleryPicker, (val) => {
  if (val) {
    loadGalleryPhotos()
  }
})

onMounted(() => {
  loadMoments()
})
</script>

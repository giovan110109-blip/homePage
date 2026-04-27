<template>
  <div class="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all hover:shadow-md">
    <!-- 头部：用户信息 -->
    <div class="p-3 sm:p-5 flex items-start gap-2.5 sm:gap-3">
      <img
        :src="moment.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'"
        :alt="moment.author?.name"
        class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <span class="font-medium text-gray-900 dark:text-white text-sm sm:text-[15px]">
            {{ moment.author?.name || '匿名用户' }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(moment.createdAt) }}</span>
        </div>
        <p v-if="moment.location?.name" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1">
          <MapPin class="w-3 h-3" />
          {{ moment.location.name }}
        </p>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="px-3 sm:px-5 pb-3 sm:pb-4">
      <!-- 文字内容 -->
      <p v-if="moment.content" class="text-gray-800 dark:text-gray-200 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
        {{ moment.content }}
      </p>

      <!-- 图片网格 -->
      <div
        v-if="(moment.type === 'image' || moment.type === 'live') && mediaUrls.length"
        class="mt-3 sm:mt-4 max-w-full"
      >
        <div
          :class="[
            'grid gap-1 sm:gap-1.5',
            mediaUrls.length === 1 ? 'grid-cols-1 max-w-[200px] sm:max-w-[280px]' : '',
            mediaUrls.length === 2 ? 'grid-cols-2' : '',
            mediaUrls.length === 4 ? 'grid-cols-2' : '',
            mediaUrls.length >= 3 && mediaUrls.length !== 4 ? 'grid-cols-3' : ''
          ]"
        >
          <div
            v-for="(img, index) in mediaUrls.slice(0, 9)"
            :key="index"
            class="relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 cursor-pointer aspect-square"
            @click="previewImage(index)"
          >
            <!-- Live Photo 使用 LivePhoto 组件 -->
            <LivePhoto
              v-if="img.isLive && img.videoUrl"
              :image-url="img.url"
              :video-url="img.videoUrl"
              :thumb-hash="img.thumbHash"
              :is-live="true"
              :width="img.width || 1"
              :height="img.height || 1"
              :photo-id="img.photoId || `${moment._id}:${index}`"
              class="w-full h-full"
            />
            <!-- 静态图片使用 LazyImage -->
            <template v-else>
              <LazyImage
                :src="img.url"
                :thumb-hash="img.thumbHash"
                :width="img.width || 1"
                :height="img.height || 1"
                class="w-full h-full"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- 视频播放器 -->
      <div v-if="moment.type === 'video' && moment.video?.url" class="mt-3 sm:mt-4">
        <div class="relative rounded-lg sm:rounded-xl overflow-hidden bg-black dark:bg-gray-900">
          <video
            :src="moment.video.url"
            :poster="moment.video.thumbnailUrl"
            controls
            class="w-full max-h-[300px] sm:max-h-[400px] object-contain"
            preload="metadata"
          />
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="px-3 sm:px-5 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
      <div class="flex items-center gap-4 sm:gap-6">
        <!-- 点赞 -->
        <button
          @click="handleLike"
          class="flex items-center gap-1.5 sm:gap-2 text-sm transition-all group"
          :class="isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'"
        >
          <Heart 
            :class="{ 'fill-current': isLiked }" 
            class="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" 
          />
          <span v-if="likeCount" class="font-medium text-xs sm:text-sm">{{ likeCount }}</span>
        </button>

        <!-- 评论 -->
        <button
          @click="toggleComments"
          class="flex items-center gap-1.5 sm:gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors group"
        >
          <MessageCircle class="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
          <span v-if="commentCount" class="font-medium text-xs sm:text-sm">{{ commentCount }}</span>
        </button>
      </div>
    </div>

    <!-- 评论区展开 -->
    <AppTransition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[1000px]"
      leave-from-class="opacity-100 max-h-[1000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="showComments" class="px-3 sm:px-5 pb-3 sm:pb-5 overflow-hidden">
        <CommentBox
          :target-id="moment._id"
          @commented="handleCommented"
        />
      </div>
    </AppTransition>

    <!-- 图片查看器 -->
    <PhotoViewer
      v-model="photoViewerVisible"
      :photos="mediaUrls"
      :current-photo="currentPhoto"
      :show-info-panel="false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppTransition from '@/components/ui/AppTransition'
import { Heart, MessageCircle, MapPin } from 'lucide-vue-next'
import CommentBox from '@/components/ui/CommentBox.vue'
import LivePhoto from '@/components/photo/LivePhoto.vue'
import LazyImage from '@/components/photo/LazyImage.vue'
import PhotoViewer from '@/components/photo/PhotoViewer.vue'
import { formatRelativeTime } from '@/utils/format'
import type { Moment, MomentMedia } from '@/types'

const props = defineProps<{
  moment: Moment
}>()

const emit = defineEmits<{
  (e: 'like', id: string): void
  (e: 'commentAdded', id: string): void
}>()

const showComments = ref(false)
const photoViewerVisible = ref(false)
const currentPhotoIndex = ref(0)
const currentPhoto = ref<MomentMedia | null>(null)

const isLiked = ref(false)
const likeCount = ref(0)
const commentCount = ref(0)

const getLikeStorageKey = () => {
  return `moment_like_${props.moment._id}`
}

const loadLikeStatus = () => {
  likeCount.value = props.moment.likes || 0
  const key = getLikeStorageKey()
  isLiked.value = localStorage.getItem(key) === 'true'
}

const handleLike = () => {
  if (isLiked.value) {
    isLiked.value = false
    likeCount.value--
    localStorage.removeItem(getLikeStorageKey())
    emit('like', props.moment._id)
  } else {
    isLiked.value = true
    likeCount.value++
    localStorage.setItem(getLikeStorageKey(), 'true')
    emit('like', props.moment._id)
  }
}

watch(() => props.moment, () => {
  loadLikeStatus()
  commentCount.value = props.moment.comments || 0
}, { immediate: true })

const mediaUrls = computed(() => {
  return (props.moment.media || []).map(item => ({
    _id: item.photoId || `temp_${Math.random().toString(36)}`,
    photoId: item.photoId,
    url: item.url,
    thumbnailUrl: item.thumbnailUrl || item.url,
    thumbHash: item.thumbHash,
    thumbnailHash: item.thumbHash,
    width: item.width,
    height: item.height,
    isLive: item.isLive,
    videoUrl: item.videoUrl,
    originalFileUrl: item.originalFileUrl,
    originalUrl: item.url,
    title: '',
  }))
})

const formatDate = formatRelativeTime

const previewImage = (index: number) => {
  currentPhotoIndex.value = index
  currentPhoto.value = mediaUrls.value[index]
  photoViewerVisible.value = true
}

const toggleComments = () => {
  showComments.value = !showComments.value
}

const handleCommented = () => {
  commentCount.value++
  emit('commentAdded', props.moment._id)
}
</script>

<style scoped>
</style>

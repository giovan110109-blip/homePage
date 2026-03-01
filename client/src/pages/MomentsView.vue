<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-blue-900 py-16 sm:py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12 sm:mb-16">
        <span class="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          MOMENTS
        </span>
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3 tracking-tight">说说</h1>
        <p class="text-gray-600 dark:text-gray-400">记录生活的点点滴滴 ✨</p>
      </div>

      <!-- 说说列表 -->
      <div v-if="loading" class="text-center py-12 flex flex-col items-center justify-center">
        <Loading />
      </div>

      <div v-else-if="moments.length === 0" class="text-center py-12">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Camera class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p class="text-gray-500 dark:text-gray-400">暂无说说</p>
      </div>

      <div v-else class="space-y-4 sm:space-y-6">
        <MomentCard
          v-for="moment in moments"
          :key="moment._id"
          :moment="moment"
          @like="handleLike"
          @comment-added="handleCommentAdded"
        />
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="text-center mt-10">
        <AppButton variant="outline" size="md" @click="loadMore" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </AppButton>
      </div>

      <!-- 没有更多 -->
      <div v-else-if="moments.length > 0" class="text-center mt-10 py-6">
        <p class="text-gray-400 dark:text-gray-500 text-sm">— 没有更多说说了 —</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Camera } from 'lucide-vue-next'
import Loading from '@/components/ui/Loading.vue'
import AppButton from '@/components/ui/AppButton.vue'
import MomentCard from '@/components/moment/MomentCard.vue'
import request from '@/api/request'

interface MomentMedia {
  url: string
  thumbnailUrl?: string
  thumbHash?: string
  width?: number
  height?: number
  photoId?: string
  isPrivate?: boolean
  isLive?: boolean
  videoUrl?: string
}

interface MomentLivePhoto {
  imageUrl?: string
  videoUrl?: string
  imagePhotoId?: string
  videoPhotoId?: string
  width?: number
  height?: number
}

interface MomentVideo {
  url: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
}

interface MomentLocation {
  latitude?: number
  longitude?: number
  name?: string
  address?: string
}

interface MomentAuthor {
  _id?: string
  name?: string
  avatar?: string
}

interface Moment {
  _id: string
  content: string
  type: 'text' | 'image' | 'video' | 'live'
  mode: 'livePhoto' | 'video'
  media: MomentMedia[]
  livePhoto?: MomentLivePhoto
  video?: MomentVideo
  location?: MomentLocation
  author: MomentAuthor
  likes: number
  comments: number
  isLiked: boolean
  reactions?: Record<string, number>
  createdAt: string
}

const moments = ref<Moment[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const page = ref(1)
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  pageCount: 1,
})

const fetchMoments = async (isLoadMore = false) => {
  try {
    if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    const res: any = await request.get('/moments', {
      params: {
        page: page.value,
        limit: 10,
      },
    })

    if (res?.success) {
      const data = res.data?.data || []
      const meta = res.data?.meta || { page: 1, pageSize: 10, total: 0, pageCount: 1 }

      if (isLoadMore) {
        moments.value = [...moments.value, ...data]
      } else {
        moments.value = data
      }

      pagination.value = meta
      hasMore.value = page.value < meta.pageCount
    }
  } catch (error) {
    console.error('获取说说失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  fetchMoments(true)
}

const handleLike = async (momentId: string) => {
  try {
    const res: any = await request.post(`/moments/${momentId}/like`)
    const moment = moments.value.find(m => m._id === momentId)
    if (moment && res?.success) {
      moment.isLiked = !moment.isLiked
      moment.likes = res.data?.likes || moment.likes + (moment.isLiked ? -1 : 1)
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const handleCommentAdded = (momentId: string) => {
  const moment = moments.value.find(m => m._id === momentId)
  if (moment) {
    moment.comments++
  }
}

onMounted(() => {
  fetchMoments()
})
</script>

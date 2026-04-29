<template>
  <div class="theme-page min-h-screen py-16 sm:py-20">
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
          :id="`moment-${moment._id}`"
          :moment="moment"
          :class="{ 'moment-portal-highlight': moment._id === focusedMomentId }"
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
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Camera } from 'lucide-vue-next'
import Loading from '@/components/ui/Loading.vue'
import AppButton from '@/components/ui/AppButton.vue'
import MomentCard from '@/components/moment/MomentCard.vue'
import request from '@/api/request'
import { usePagination } from '@/composables/usePagination'
import type { Moment } from '@/types'

const route = useRoute()
const focusedMomentId = computed(() =>
  typeof route.query.moment === 'string' ? route.query.moment : '',
)

const {
  data: moments,
  loading,
  loadingMore,
  hasMore,
  fetch: fetchMoments,
  loadMore,
} = usePagination<Moment>({
  fetcher: async (page, pageSize) => {
    const res: any = await request.get('/moments', {
      params: { page, limit: pageSize },
    })
    return {
      data: res?.data || [],
      meta: res?.meta || { page, pageSize, total: 0, pageCount: 1 },
    }
  },
  pageSize: 10,
})

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

const scrollToFocusedMoment = async () => {
  if (!focusedMomentId.value) return
  await nextTick()
  document
    .getElementById(`moment-${focusedMomentId.value}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const ensureFocusedMoment = async () => {
  const momentId = focusedMomentId.value
  if (!momentId) return

  if (!moments.value.some(moment => moment._id === momentId)) {
    try {
      const res: any = await request.get(`/moments/${momentId}`)
      const moment = res?.data
      if (moment?._id) {
        moments.value = [moment, ...moments.value]
      }
    } catch (error) {
      console.error('加载随机说说失败:', error)
    }
  }

  await scrollToFocusedMoment()
}

watch(focusedMomentId, () => {
  ensureFocusedMoment()
})

onMounted(async () => {
  await fetchMoments()
  await ensureFocusedMoment()
})
</script>

<style scoped>
.moment-portal-highlight {
  position: relative;
  border-color: color-mix(in srgb, var(--theme-accent) 68%, transparent);
  box-shadow:
    0 0 0 4px var(--theme-accent-soft),
    0 24px 70px color-mix(in srgb, var(--theme-accent) 20%, transparent);
}

.moment-portal-highlight::before {
  position: absolute;
  inset: -0.45rem;
  z-index: -1;
  border: 1px solid color-mix(in srgb, var(--theme-accent) 42%, transparent);
  border-radius: 1.35rem;
  content: "";
  pointer-events: none;
}
</style>

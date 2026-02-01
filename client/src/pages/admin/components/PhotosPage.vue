<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">相册管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">上传和管理照片</p>
    </div>

    <el-card shadow="hover" class="h-full flex flex-col">
      <!-- 上传区域 -->
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold text-gray-900 dark:text-white">上传照片</span>
        </div>
      </template>

      <div class="space-y-4 mb-6">
        <!-- 拖拽上传区域 -->
        <div
          class="border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-all duration-300 min-h-[180px] flex flex-col items-center justify-center"
          :class="isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-300 dark:border-gray-600'"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <Upload class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-gray-500" />
          <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 font-medium px-2">点击或拖拽文件到这里上传</p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">支持图片（JPG、PNG、HEIC）和视频（MOV、MP4）格式，单个文件最大 200MB</p>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,video/*"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>
      </div>

      <!-- 任务队列统计 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="text-center">
            <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-2">队列中</p>
            <p class="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400">{{ queuedCount }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">等待上传</p>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="text-center">
            <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-2">上传中</p>
            <p class="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{{ uploadingCount }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">1个/次</p>
          </div>
        </div>
        
        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="text-center">
            <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-2">处理中</p>
            <p class="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{{ taskStats.processing }}</p>
          </div>
        </div>
        
        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="text-center">
            <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-2">完成/失败</p>
            <p class="text-2xl sm:text-3xl font-bold">
              <span class="text-green-600 dark:text-green-400">{{ taskStats.completed }}</span>
              <span class="text-gray-400 dark:text-gray-500 mx-1">/</span>
              <span class="text-red-600 dark:text-red-400">{{ taskStats.failed }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 失败任务列表 -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <span class="font-semibold text-gray-900 dark:text-white">失败任务</span>
          <AppButton variant="primary" size="sm" @click="loadFailedTasks">刷新</AppButton>
        </div>

        <div v-if="failedLoading" class="text-sm text-gray-500 dark:text-gray-400">加载中...</div>
        <div v-else-if="failedTasks.length === 0" class="text-sm text-gray-500 dark:text-gray-400">暂无失败任务</div>
        <div v-else class="space-y-3">
          <div
            v-for="task in failedTasks"
            :key="task.taskId"
            class="p-3 rounded-lg border border-red-200/60 dark:border-red-900/60 bg-red-50/60 dark:bg-red-900/10"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ task.originalFileName }}
                </div>
                <div class="text-xs text-red-600 dark:text-red-400 mt-1">
                  {{ task.error?.message || '处理失败' }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  尝试 {{ task.attempts }}/{{ task.maxAttempts }} · {{ task.stage || 'unknown' }}
                </div>
              </div>
              <AppButton variant="danger" size="sm" @click="retryFailedTask(task.taskId)">
                重试
              </AppButton>
            </div>
          </div>
        </div>
      </div>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Upload } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import { useUploadQueueStore } from '@/stores/uploadQueue'
import { storeToRefs } from 'pinia'

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadQueueStore = useUploadQueueStore()
const { taskStats, failedTasks, failedLoading, queuedCount, uploadingCount } = storeToRefs(uploadQueueStore)


const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    uploadFiles(Array.from(target.files))
  }
  target.value = ''
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files) {
    uploadFiles(Array.from(files))
  }
}

/**
 * 将文件加入上传队列
 */
const uploadFiles = async (files: File[]) => {
  uploadQueueStore.enqueueFiles(files)
}

const loadFailedTasks = async () => {
  await uploadQueueStore.loadFailedTasks()
}

const retryFailedTask = async (taskId: string) => {
  await uploadQueueStore.retryFailedTask(taskId)
}

onMounted(() => {
  uploadQueueStore.loadTaskStats()
  uploadQueueStore.loadFailedTasks()
})
</script>

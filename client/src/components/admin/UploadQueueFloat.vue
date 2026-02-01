<template>
  <div class="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm">
    <Transition
      enterActiveClass="animate-fade-in"
      leaveActiveClass="animate-fade-out"
    >
      <div
        v-if="queuedCount > 0"
        class="pointer-events-auto bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 p-3 text-center"
      >
        <p class="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
          📋 队列中还有 <strong>{{ queuedCount }}</strong> 个文件等待上传
        </p>
      </div>
    </Transition>

    <transition-group name="upload-list" tag="div" class="space-y-3">
      <div
        v-for="file in activeUploads"
        :key="file.id"
        :class="`upload-card ${file.status}`"
        class="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 p-4"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <Image class="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span class="text-sm font-medium truncate text-gray-900 dark:text-white">{{ file.name }}</span>
          </div>
          <el-tag :type="getStatusType(file.status)" size="small" class="ml-2 flex-shrink-0">
            {{ getStatusText(file.status) }}
          </el-tag>
        </div>

        <el-progress
          :percentage="file.progress"
          :color="getProgressColor(file.status)"
          :stroke-width="4"
          class="mb-2"
        />

        <div v-if="file.stage && file.status !== 'completed'" class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span class="inline-block w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
          {{ getStageText(file.stage) }}
        </div>

        <div v-if="file.error" class="mt-2 text-xs text-red-500 flex items-center gap-1">
          <span>❌</span>
          {{ file.error }}
        </div>

        <div v-if="file.status === 'error' && file.taskId" class="mt-2">
          <AppButton variant="danger" size="sm" @click="retryTaskFromUpload(file)">重试</AppButton>
        </div>

        <div v-if="file.status === 'completed'" class="text-xs text-green-500 flex items-center gap-1">
          <span>✅</span>
          上传成功
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { Image } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import { useUploadQueueStore } from '@/stores/uploadQueue'
import { storeToRefs } from 'pinia'

const uploadQueueStore = useUploadQueueStore()
const { activeUploads, queuedCount } = storeToRefs(uploadQueueStore)

const retryTaskFromUpload = (file: any) => {
  uploadQueueStore.retryTaskFromUpload(file)
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    queued: 'info',
    uploading: 'primary',
    processing: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    queued: '队列中',
    uploading: '上传中',
    processing: '处理中',
    completed: '完成',
    error: '失败'
  }
  return map[status] || status
}

const getStageText = (stage: string) => {
  const map: Record<string, string> = {
    upload: '上传文件',
    live_photo_detection: 'Live Photo 检测',
    format_conversion: '格式转换',
    metadata_extraction: '提取元数据',
    thumbnail_generation: '生成缩略图',
    location_lookup: '地理位置解析',
    database_save: '保存到数据库'
  }
  return map[stage] || stage
}

const getProgressColor = (status: string) => {
  const map: Record<string, string> = {
    queued: '#909399',
    uploading: '#409eff',
    processing: '#e6a23c',
    completed: '#67c23a',
    error: '#f56c6c'
  }
  return map[status] || '#909399'
}
</script>

<style scoped>
.upload-card {
  border-left: 4px solid #909399;
}

.upload-card.queued {
  border-left-color: #909399;
}

.upload-card.uploading {
  border-left-color: #409eff;
}

.upload-card.processing {
  border-left-color: #e6a23c;
}

.upload-card.completed {
  border-left-color: #67c23a;
}

.upload-card.error {
  border-left-color: #f56c6c;
}

.upload-list-move {
  transition: all 0.4s ease;
}

.upload-list-enter-active {
  transition: all 0.4s ease-out;
}

.upload-list-leave-active {
  transition: all 0.4s ease-in;
}

.upload-list-enter-from {
  transform: translateX(350px);
  opacity: 0;
}

.upload-list-leave-to {
  transform: translateX(350px);
  opacity: 0;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-fade-out {
  animation: fadeOut 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(10px);
  }
}
</style>

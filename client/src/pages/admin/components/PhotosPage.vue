<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">相册管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">上传和管理照片</p>
    </div>

    <!-- 上传区域 -->
    <el-card shadow="hover" class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">上传照片</span>
        </div>
      </template>

      <div class="space-y-4">
        <!-- 拖拽上传区域 -->
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300"
          :class="isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-300 dark:border-gray-600'"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <Upload class="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p class="text-gray-600 dark:text-gray-300 mb-2 font-medium">点击或拖拽文件到这里上传</p>
          <p class="text-sm text-gray-500">支持图片（JPG、PNG、HEIC）和视频（MOV、MP4）格式，单个文件最大 200MB</p>
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
    </el-card>

    <!-- 任务队列统计 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-sm mb-2">总任务数</p>
          <p class="text-3xl font-bold text-blue-600">{{ taskStats.total }}</p>
        </div>
      </el-card>
      
      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-sm mb-2">成功</p>
          <p class="text-3xl font-bold text-green-600">{{ taskStats.completed }}</p>
        </div>
      </el-card>
      
      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-sm mb-2">处理中</p>
          <p class="text-3xl font-bold text-yellow-600">{{ taskStats.processing }}</p>
        </div>
      </el-card>
      
      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-sm mb-2">失败</p>
          <p class="text-3xl font-bold text-red-600">{{ taskStats.failed }}</p>
        </div>
      </el-card>
    </div>

    <!-- 失败任务列表 -->
    <el-card shadow="hover" class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">失败任务</span>
          <el-button size="small" @click="loadFailedTasks">刷新</el-button>
        </div>
      </template>

      <div v-if="failedLoading" class="text-sm text-gray-500">加载中...</div>
      <div v-else-if="failedTasks.length === 0" class="text-sm text-gray-500">暂无失败任务</div>
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
              <div class="text-xs text-gray-500 mt-1">
                尝试 {{ task.attempts }}/{{ task.maxAttempts }} · {{ task.stage || 'unknown' }}
              </div>
            </div>
            <el-button type="danger" size="small" @click="retryFailedTask(task.taskId)">
              重试
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 上传通知浮窗 -->
    <div class="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm">
      <transition-group name="upload-notify" tag="div" class="space-y-3">
        <div
          v-for="file in activeUploads"
          :key="file.id"
          :class="`upload-card ${file.status}`"
          class="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 p-4 transform transition-all duration-300"
        >
          <!-- 头部 -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <Image class="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span class="text-sm font-medium truncate text-gray-900 dark:text-white">{{ file.name }}</span>
            </div>
            <el-tag :type="getStatusType(file.status)" size="small" class="ml-2 flex-shrink-0">
              {{ getStatusText(file.status) }}
            </el-tag>
          </div>

          <!-- 进度条 -->
          <el-progress
            :percentage="file.progress"
            :color="getProgressColor(file.status)"
            :stroke-width="4"
            class="mb-2"
          />

          <!-- 阶段信息 -->
          <div v-if="file.stage && file.status !== 'completed'" class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span class="inline-block w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
            {{ getStageText(file.stage) }}
          </div>

          <!-- 错误信息 -->
          <div v-if="file.error" class="mt-2 text-xs text-red-500 flex items-center gap-1">
            <span>❌</span>
            {{ file.error }}
          </div>

          <!-- 成功信息 -->
          <div v-if="file.status === 'completed'" class="text-xs text-green-500 flex items-center gap-1">
            <span>✅</span>
            上传成功
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Upload, Image } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

interface UploadingFile {
  id: string
  name: string
  file: File
  taskId?: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  stage?: string
  error?: string
  createdTime?: number
}

const isDragging = ref(false)
const uploadingFiles = ref<UploadingFile[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
let taskPoller: number | null = null

const taskStats = ref({
  total: 0,
  completed: 0,
  processing: 0,
  failed: 0
})

interface FailedTask {
  taskId: string
  originalFileName: string
  status: string
  stage?: string
  progress?: number
  error?: { message?: string }
  attempts: number
  maxAttempts: number
  createdAt?: string
  updatedAt?: string
}

const failedTasks = ref<FailedTask[]>([])
const failedLoading = ref(false)

// 只显示活跃的上传任务
const activeUploads = computed(() => {
  return uploadingFiles.value
})

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

const uploadFiles = async (files: File[]) => {
  for (const file of files) {
    const uploadFile: UploadingFile = {
      id: `${Date.now()}_${Math.random()}`,
      name: file.name,
      file,
      status: 'uploading',
      progress: 0,
      createdTime: Date.now()
    }

    uploadingFiles.value.push(uploadFile)
    uploadSingleFile(uploadFile)
  }
}

const uploadSingleFile = async (uploadFile: UploadingFile) => {
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.file)

    // 上传文件
    const res: any = await request.post('/photos/upload', formData, {
      onUploadProgress: (e: any) => {
        const total = e.total || uploadFile.file.size || 0
        if (total > 0) {
          uploadFile.progress = Math.round((e.loaded / total) * 100)
        }
      }
    })

    if (res?.success) {
      uploadFile.taskId = res.data.taskId
      uploadFile.status = 'processing'
      uploadFile.progress = 0 // 重置进度条用于处理阶段
      startTaskPolling()
    } else {
      throw new Error(res?.message || '上传失败')
    }
  } catch (error: any) {
    uploadFile.status = 'error'
    uploadFile.error = error.message || '上传失败'
    uploadFile.createdTime = Date.now()
    ElMessage.error(`${uploadFile.name}: ${uploadFile.error}`)
  }
}

const startTaskPolling = () => {
  if (taskPoller) return
  taskPoller = window.setInterval(async () => {
    const pending = uploadingFiles.value.filter((file) => file.taskId && file.status === 'processing')
    if (pending.length === 0) {
      if (taskPoller) {
        clearInterval(taskPoller)
        taskPoller = null
      }
      return
    }

    try {
      const taskIds = pending.map((file) => file.taskId)
      const res: any = await request.post('/photos/tasks/batch', { taskIds })

      if (!res?.success) return

      const tasks = res.data?.tasks || []
      const taskMap = new Map(tasks.map((t: any) => [t.taskId, t]))

      for (const uploadFile of pending) {
        const task = taskMap.get(uploadFile.taskId)
        if (!task) continue

        const { status, stage, progress, error } = task
        uploadFile.status = status === 'completed' ? 'completed' : status === 'failed' ? 'error' : 'processing'
        uploadFile.stage = stage
        uploadFile.progress = Math.min(Math.max(progress || 0, 0), 100)

        if (status === 'completed') {
          uploadFile.progress = 100
          uploadFile.createdTime = Date.now()
          loadTaskStats()
          // 完成后3秒自动移除
          setTimeout(() => {
            const index = uploadingFiles.value.findIndex(f => f.id === uploadFile.id)
            if (index > -1) uploadingFiles.value.splice(index, 1)
          }, 3000)
        } else if (status === 'failed') {
          uploadFile.error = error?.message || '处理失败'
          uploadFile.createdTime = Date.now()
          // 失败后5秒自动移除
          setTimeout(() => {
            const index = uploadingFiles.value.findIndex(f => f.id === uploadFile.id)
            if (index > -1) uploadingFiles.value.splice(index, 1)
          }, 5000)
        }
      }
    } catch (error) {
      console.error('轮询任务状态失败:', error)
    }
  }, 1000) // 改为1秒轮询，反馈更快
}

const loadTaskStats = async () => {
  try {
    const res: any = await request.get('/photos/tasks/stats')
    
    if (res?.success) {
      taskStats.value = {
        total: (res.data.pending || 0) + (res.data.processing || 0) + (res.data.completed || 0) + (res.data.failed || 0),
        completed: res.data.completed || 0,
        processing: res.data.processing || 0,
        failed: res.data.failed || 0
      }
    }
  } catch (error) {
    console.error('加载任务统计失败:', error)
  }
}

const loadFailedTasks = async () => {
  try {
    failedLoading.value = true
    const res: any = await request.get('/photos/tasks/failed', { params: { page: 1, limit: 50 } })
    if (res?.success) {
      failedTasks.value = res.data?.tasks || []
    }
  } catch (error) {
    console.error('加载失败任务列表失败:', error)
  } finally {
    failedLoading.value = false
  }
}

const retryFailedTask = async (taskId: string) => {
  try {
    const res: any = await request.post(`/photos/tasks/${taskId}/retry`)
    if (res?.success) {
      ElMessage.success('已重试')
      loadFailedTasks()
      loadTaskStats()
      startTaskPolling()
    } else {
      throw new Error(res?.message || '重试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '重试失败')
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    uploading: 'primary',
    processing: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
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
    uploading: '#409eff',
    processing: '#e6a23c',
    completed: '#67c23a',
    error: '#f56c6c'
  }
  return map[status] || '#909399'
}

onMounted(() => {
  loadTaskStats()
  loadFailedTasks()
})
</script>

<style scoped>
/* 上传通知卡片样式 */
.upload-card {
  border-left: 4px solid #909399;
  animation: slideInRight 0.3s ease-out;
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

/* 过渡动画 */
.upload-notify-enter-active,
.upload-notify-leave-active {
  transition: all 0.3s ease;
}

.upload-notify-enter-from {
  transform: translateX(500px);
  opacity: 0;
}

.upload-notify-leave-to {
  transform: translateX(500px);
  opacity: 0;
}

@keyframes slideInRight {
  from {
    transform: translateX(500px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>

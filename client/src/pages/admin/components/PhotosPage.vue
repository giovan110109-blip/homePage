<template>
  <div class="w-full min-h-screen flex flex-col p-4 sm:p-6">
    <div class="mb-4 sm:mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">相册管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">上传和管理照片</p>
    </div>

    <!-- 上传区域 -->
    <el-card shadow="hover" class="mb-4 sm:mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">上传照片</span>
        </div>
      </template>

      <div class="space-y-4">
        <!-- 拖拽上传区域 -->
        <div
          class="border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-all duration-300 min-h-[180px] flex flex-col items-center justify-center"
          :class="isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-300 dark:border-gray-600'"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <Upload class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
          <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 font-medium px-2">点击或拖拽文件到这里上传</p>
          <p class="text-xs sm:text-sm text-gray-500 px-4">支持图片（JPG、PNG、HEIC）和视频（MOV、MP4）格式，单个文件最大 200MB</p>
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
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">队列中</p>
          <p class="text-2xl sm:text-3xl font-bold text-gray-600">{{ queuedCount }}</p>
          <p class="text-xs text-gray-400 mt-1">等待上传</p>
        </div>
      </el-card>

      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">上传中</p>
          <p class="text-2xl sm:text-3xl font-bold text-blue-600">{{ uploadingCount }}</p>
          <p class="text-xs text-gray-400 mt-1">1个/次</p>
        </div>
      </el-card>
      
      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">处理中</p>
          <p class="text-2xl sm:text-3xl font-bold text-yellow-600">{{ taskStats.processing }}</p>
        </div>
      </el-card>
      
      <el-card shadow="hover">
        <div class="text-center">
          <p class="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">完成/失败</p>
          <p class="text-2xl sm:text-3xl font-bold">
            <span class="text-green-600">{{ taskStats.completed }}</span>
            <span class="text-gray-400 mx-1">/</span>
            <span class="text-red-600">{{ taskStats.failed }}</span>
          </p>
        </div>
      </el-card>
    </div>

    <!-- 失败任务列表 -->
    <el-card shadow="hover" class="mb-4 sm:mb-6">
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
      <!-- 队列提示 -->
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
          class="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 p-4 transform transition-all duration-500 ease-in-out"
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
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  stage?: string
  error?: string
  createdTime?: number
}

const isDragging = ref(false)
const uploadingFiles = ref<UploadingFile[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
let taskPoller: number | null = null

// 上传队列控制
let isUploading = false
let uploadQueue: UploadingFile[] = []

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

// 最多显示的浮窗数量
const MAX_VISIBLE_UPLOADS = 5

// 按添加顺序显示上传任务(最多5个),保持稳定不跳动
const activeUploads = computed(() => {
  // 按照原始顺序(添加时间)显示,不做复杂的优先级排序
  // 这样任务完成后位置不会跳动,体验更稳定
  return uploadingFiles.value.slice(0, MAX_VISIBLE_UPLOADS)
})

// 计算队列中的文件数
const queuedCount = computed(() => {
  return uploadingFiles.value.filter(f => f.status === 'queued').length
})

// 计算上传中的文件数
const uploadingCount = computed(() => {
  return uploadingFiles.value.filter(f => f.status === 'uploading').length
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

/**
 * 将文件加入上传队列
 */
const uploadFiles = async (files: File[]) => {
  // 将所有文件添加到队列中
  for (const file of files) {
    const uploadFile: UploadingFile = {
      id: `${Date.now()}_${Math.random()}`,
      name: file.name,
      file,
      status: 'queued',
      progress: 0,
      createdTime: Date.now()
    }

    uploadingFiles.value.push(uploadFile)
    uploadQueue.push(uploadFile)
  }

  // 如果还没有开始上传，立即开始处理队列
  if (!isUploading) {
    processUploadQueue()
  }
}

/**
 * 处理上传队列，一次只上传一个文件
 */
const processUploadQueue = async () => {
  if (isUploading) return
  if (uploadQueue.length === 0) return

  isUploading = true
  const uploadFile = uploadQueue.shift()!

  try {
    uploadFile.status = 'uploading'
    await uploadSingleFile(uploadFile)
  } catch (error) {
    // 错误已在 uploadSingleFile 中处理
  } finally {
    isUploading = false
    // 继续处理队列中的下一个文件
    if (uploadQueue.length > 0) {
      // 使用 setTimeout 避免栈溢出
      setTimeout(() => {
        processUploadQueue()
      }, 500)
    }
  }
}

const uploadSingleFile = async (uploadFile: UploadingFile) => {
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.file)

    // 上传文件，针对上传设置更长的超时时间
    const res: any = await request.post('/photos/upload', formData, {
      timeout: 15 * 60 * 1000, // 15分钟超时用于大文件上传
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
    // 区分网络错误和其他错误
    if (error.code === 'ECONNABORTED') {
      uploadFile.error = '请求超时，请重试'
    } else if (error.message?.includes('Request aborted')) {
      uploadFile.error = '连接中断，请检查网络并重试'
    } else if (!error.message) {
      uploadFile.error = '网络连接失败'
    } else {
      uploadFile.error = error.message || '上传失败'
    }
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
        const task = taskMap.get(uploadFile.taskId) as any
        if (!task) continue

        const { status, stage, progress, error } = task
        uploadFile.status = status === 'completed' ? 'completed' : status === 'failed' ? 'error' : 'processing'
        uploadFile.stage = stage
        uploadFile.progress = Math.min(Math.max(progress || 0, 0), 100)

        if (status === 'completed') {
          uploadFile.progress = 100
          uploadFile.createdTime = Date.now()
          loadTaskStats()
          // 显示成功提示
          ElMessage.success(`${uploadFile.name} 已完成（图片方向已自动纠正）`)
          // 完成后3秒自动移除,给用户足够时间看到完成状态
          setTimeout(() => {
            const index = uploadingFiles.value.findIndex(f => f.id === uploadFile.id)
            if (index > -1) uploadingFiles.value.splice(index, 1)
          }, 3000)
        } else if (status === 'failed') {
          uploadFile.error = error?.message || '处理失败'
          uploadFile.createdTime = Date.now()
          // 失败后6秒自动移除,给用户时间查看错误信息
          setTimeout(() => {
            const index = uploadingFiles.value.findIndex(f => f.id === uploadFile.id)
            if (index > -1) uploadingFiles.value.splice(index, 1)
          }, 6000)
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

/* 平滑过渡动画 - 上传列表 */
.upload-list-move {
  transition: all 0.6s ease;
}

.upload-list-enter-active {
  transition: all 0.5s ease-out;
}

.upload-list-leave-active {
  transition: all 0.5s ease-in;
  position: absolute;
}

.upload-list-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.upload-list-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

/* 队列提示淡入淡出 */
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

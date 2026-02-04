import { defineStore } from 'pinia'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

export interface UploadingFile {
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

const MAX_VISIBLE_UPLOADS = 5

export const useUploadQueueStore = defineStore('uploadQueue', () => {
  const uploadingFiles = ref<UploadingFile[]>([])
  const uploadQueue = ref<UploadingFile[]>([])
  const isUploading = ref(false)
  const taskPoller = ref<number | null>(null)

  const taskStats = ref({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0
  })

  const failedTasks = ref<FailedTask[]>([])
  const failedLoading = ref(false)

  const activeUploads = computed(() => uploadingFiles.value.slice(0, MAX_VISIBLE_UPLOADS))
  const queuedCount = computed(() => uploadingFiles.value.filter(f => f.status === 'queued').length)
  const uploadingCount = computed(() => uploadingFiles.value.filter(f => f.status === 'uploading').length)

  const enqueueFiles = (files: File[]) => {
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
      uploadQueue.value.push(uploadFile)
    }

    if (!isUploading.value) {
      processUploadQueue()
    }
  }

  const processUploadQueue = async () => {
    if (isUploading.value || uploadQueue.value.length === 0) return

    isUploading.value = true
    const uploadFile = uploadQueue.value.shift()!

    try {
      uploadFile.status = 'uploading'
      await uploadSingleFile(uploadFile)
    } catch {
      // errors handled in uploadSingleFile
    } finally {
      isUploading.value = false
      if (uploadQueue.value.length > 0) {
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

      const res: any = await request.post('/photos/upload', formData, {
        timeout: 15 * 60 * 1000,
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
        uploadFile.progress = 0
        startTaskPolling()
      } else {
        throw new Error(res?.message || '上传失败')
      }
    } catch (error: any) {
      uploadFile.status = 'error'
      uploadFile.stage = 'upload'
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
    if (taskPoller.value) return

    taskPoller.value = window.setInterval(async () => {
      const pending = uploadingFiles.value.filter((file) => file.taskId && file.status === 'processing')
      if (pending.length === 0) {
        if (taskPoller.value) {
          clearInterval(taskPoller.value)
          taskPoller.value = null
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
          uploadFile.progress = Math.max(uploadFile.progress, Math.min(Math.max(progress || 0, 0), 100))

          if (status === 'completed') {
            uploadFile.progress = 100
            uploadFile.createdTime = Date.now()
            loadTaskStats()
            setTimeout(() => {
              const index = uploadingFiles.value.findIndex(f => f.id === uploadFile.id)
              if (index > -1) uploadingFiles.value.splice(index, 1)
            }, 3000)
          } else if (status === 'failed') {
            uploadFile.error = error?.message || '处理失败'
            uploadFile.createdTime = Date.now()
            loadFailedTasks()
            loadTaskStats()
          }
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }
    }, 1000)
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

  const retryTaskFromUpload = async (uploadFile: UploadingFile) => {
    if (!uploadFile.taskId) return
    try {
      const res: any = await request.post(`/photos/tasks/${uploadFile.taskId}/retry`)
      if (res?.success) {
        uploadFile.status = 'processing'
        uploadFile.progress = 0
        uploadFile.stage = 'upload'
        uploadFile.error = undefined
        ElMessage.success('已重试')
        loadFailedTasks()
        loadTaskStats()
        startTaskPolling()
      } else {
        throw new Error(res?.message || '重试失败')
      }
    } catch (error: any) {
      uploadFile.error = error.message || '重试失败'
      ElMessage.error(error.message || '重试失败')
    }
  }

  return {
    uploadingFiles,
    activeUploads,
    queuedCount,
    uploadingCount,
    taskStats,
    failedTasks,
    failedLoading,
    enqueueFiles,
    loadTaskStats,
    loadFailedTasks,
    retryFailedTask,
    retryTaskFromUpload
  }
})

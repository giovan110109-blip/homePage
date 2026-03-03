import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import { wsService } from '@/utils/websocket'
import { useAuthStore } from '@/stores/auth'

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
  const wsUnsub = ref<(() => void) | null>(null)

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

  const startWs = async () => {
    if (wsUnsub.value) return
    const token = useAuthStore().token
    if (!token) return

    await wsService.connect()
    wsUnsub.value = wsService.subscribe(token, (data: any) => {
      const f = uploadingFiles.value.find(x => x.taskId === data.taskId)
      if (!f) return
      f.status = data.status === 'completed' ? 'completed' : data.status === 'failed' ? 'error' : 'processing'
      f.stage = data.stage
      f.progress = Math.max(f.progress, data.progress || 0)
      if (data.status === 'completed') {
        f.progress = 100
        setTimeout(() => {
          const i = uploadingFiles.value.findIndex(x => x.id === f.id)
          if (i > -1) uploadingFiles.value.splice(i, 1)
        }, 2000)
      }
    })
  }

  const enqueueFiles = async (files: File[]) => {
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

    await startWs()

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
        await startWs()
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
        await startWs()
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

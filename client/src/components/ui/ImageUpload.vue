<template>
  <div class="image-upload-wrapper">
    <el-upload
      :class="['image-upload', { 'has-image': modelValue }]"
      :action="`${apiBaseUrl}/api/upload`"
      :show-file-list="false"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      :disabled="disabled"
      :headers="uploadHeaders"
    >
      <div v-if="modelValue" class="image-preview">
        <el-image :src="modelValue" fit="cover" class="w-full h-full" />
        <div class="image-overlay">
          <span class="text-white text-sm">点击更换</span>
        </div>
      </div>
      <div v-else class="upload-placeholder">
        <Plus class="upload-icon" />
        <div class="upload-text">{{ placeholder }}</div>
      </div>
    </el-upload>
    
    <div v-if="modelValue && showDelete" class="mt-2">
      <el-button type="danger" size="small" @click="handleDelete">删除图片</el-button>
    </div>
    
    <div v-if="tip" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      {{ tip }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL } = import.meta.env

// 在生产环境中使用 VITE_API_BASE_URL，在本地开发中使用 VITE_API_BASE_URL_LOCAL
const apiBaseUrl = import.meta.env.DEV ? VITE_API_BASE_URL_LOCAL:VITE_API_BASE_URL 

interface Props {
  modelValue?: string
  placeholder?: string
  tip?: string
  maxSize?: number // MB
  showDelete?: boolean
  disabled?: boolean
  accept?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '上传图片',
  tip: '',
  maxSize: 5,
  showDelete: true,
  disabled: false,
  accept: 'image/*'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'success': [url: string]
  'delete': []
}>()

const authStore = useAuthStore()


const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token}`
}))

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }

  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB！`)
    return false
  }

  return true
}

const handleSuccess = (response: any) => {
  const data = response?.data || response
  if (data?.url) {
    let url= data.url.startsWith('http') 
      ? data.url 
      : `${apiBaseUrl}${data.url}`
    
    emit('update:modelValue', url)
    emit('success', url)
    ElMessage.success('上传成功')
  } else {
    ElMessage.error('上传失败，未返回图片地址')
  }
}

const handleError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败，请重试')
}

const handleDelete = async () => {
  if (!props.modelValue) return
  
  try {
    // 解析文件名，支持相对路径或完整 URL
    const url = props.modelValue
    const pathname = new URL(url, window.location.origin).pathname
    const parts = pathname.split('/').filter(Boolean)
    const filename = parts.pop()
    if (!filename) {
      ElMessage.error('无法解析文件名')
      return
    }

    const request = (await import('@/api/request')).default
    await request.delete(`/upload/${encodeURIComponent(filename)}`)
    emit('update:modelValue', '')
    emit('delete')
    ElMessage.success('删除成功')
  } catch (error: any) {
    console.error('删除图片失败:', error)
    ElMessage.error('删除失败，请重试')
  }
}
</script>

<style scoped>
.image-upload-wrapper {
  display: inline-block;
}

.image-upload {
  width: 148px;
  height: 148px;
  border-radius: 8px;
  overflow: hidden;
}

.image-upload :deep(.el-upload) {
  width: 100%;
  height: 100%;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.image-upload :deep(.el-upload:hover) {
  border-color: #409eff;
}

.image-upload.has-image :deep(.el-upload) {
  border: none;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8c939d;
}

.upload-icon {
  width: 28px;
  height: 28px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
}
</style>

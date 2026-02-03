<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">相册管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">上传和管理照片</p>
    </div>

    <el-card
      shadow="hover"
      class="flex-1 min-h-0 flex flex-col"
      :body-style="{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }"
    >
      <div class="flex-1 min-h-0 overflow-auto">
        <el-tabs v-model="activeTab" class="mb-2">
        <el-tab-pane label="图片管理" name="photos">
          <!-- 上传区域 -->
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

          <!-- 失败任务列表 - 已暂时屏蔽，重试功能在弹窗中 -->
          <!-- <div class="mb-6">
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
          </div> -->

          <!-- 图片列表 -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="font-semibold text-gray-900 dark:text-white">图片列表</span>
              <div class="flex items-center gap-2">
                <AppButton 
                  v-if="selectedPhotos.length > 0" 
                  variant="danger" 
                  size="sm" 
                  @click="batchDeletePhotos"
                >
                  批量删除 ({{ selectedPhotos.length }})
                </AppButton>
                <AppButton variant="reset" size="sm" @click="loadPhotos">刷新</AppButton>
              </div>
            </div>

            <el-table 
              :data="photoTableData" 
              stripe 
              v-loading="photoLoading" 
              style="width: 100%"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="50" />
              <el-table-column label="缩略图" width="90">
                <template #default="scope">
                  <img
                    :src="getPhotoImageUrl(scope.row)"
                    :alt="scope.row.title || scope.row.originalFileName"
                    class="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
                    loading="lazy"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="title" label="标题" min-width="160" />
              <el-table-column prop="originalFileName" label="文件名" min-width="200" />
              <el-table-column label="尺寸" width="110">
                <template #default="scope">
                  {{ scope.row.width }}×{{ scope.row.height }}
                </template>
              </el-table-column>
              <el-table-column label="大小" width="110">
                <template #default="scope">
                  {{ formatFileSize(scope.row.fileSize) }}
                </template>
              </el-table-column>
              <el-table-column prop="isLive" label="实况" width="90">
                <template #default="scope">
                  <el-tag :type="getLiveTagType(scope.row.isLive)">
                    {{ getLiveLabel(scope.row.isLive) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="上传时间" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="scope">
                  <div class="flex items-center gap-2">
                    <AppButton variant="link-primary" size="none" @click="openPhotoDialog(scope.row)">编辑</AppButton>
                    <el-dropdown trigger="click" @command="(cmd) => handlePhotoAction(cmd, scope.row)" class="inline-flex items-center">
                      <AppButton variant="link-primary" size="none" class="inline-flex items-center">
                        更多<span class="ml-0.5">▾</span>
                      </AppButton>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="rotate-clockwise">⟳ 顺时针 90°</el-dropdown-item>
                          <el-dropdown-item command="rotate-counterclockwise">⟲ 逆时针 90°</el-dropdown-item>
                          <li class="el-dropdown-menu__item" style="height: 1px; padding: 0; margin: 5px 0; background: #e4e7eb; cursor: default;"></li>
                          <el-dropdown-item command="refresh-exif">🔄 重新获取EXIF</el-dropdown-item>
                          <el-dropdown-item command="refresh-geoinfo" :disabled="!scope.row.location">📍 重新获取位置</el-dropdown-item>
                          <el-dropdown-item command="set-location">🗺️ 设置位置</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <AppButton variant="link-danger" size="none" @click="deletePhoto(scope.row)">删除</AppButton>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div class="mt-6 flex justify-center">
              <el-pagination
                v-model:current-page="photoPagination.page"
                v-model:page-size="photoPagination.pageSize"
                :total="photoPagination.total"
                layout="prev, pager, next, sizes"
                @size-change="loadPhotos"
                @current-change="loadPhotos"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="相册管理" name="albums">
          <div class="flex items-center justify-between mb-4">
            <span class="font-semibold text-gray-900 dark:text-white">相册列表</span>
            <div class="flex items-center gap-2">
              <AppButton variant="primary" size="sm" @click="openAlbumDialog()">新增相册</AppButton>
              <AppButton variant="reset" size="sm" @click="loadAlbums">刷新</AppButton>
            </div>
          </div>

          <el-table :data="albumTableData" stripe v-loading="albumLoading" style="width: 100%">
            <el-table-column prop="name" label="相册名称" min-width="180" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'smart' ? 'warning' : 'info'">
                  {{ scope.row.type === 'smart' ? '智能' : '普通' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140">
              <template #default="scope">
                <div class="flex items-center gap-2">
                  <AppButton variant="link-primary" size="none" @click="openAlbumDialog(scope.row)">编辑</AppButton>
                  <AppButton variant="link-danger" size="none" @click="deleteAlbum(scope.row)">删除</AppButton>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="mt-6 flex justify-center">
            <el-pagination
              v-model:current-page="albumPagination.page"
              v-model:page-size="albumPagination.pageSize"
              :total="albumPagination.total"
              layout="prev, pager, next, sizes"
              @size-change="loadAlbums"
              @current-change="loadAlbums"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
      </div>
    </el-card>

    <el-dialog 
      v-model="albumDialogVisible" 
      :title="albumForm._id ? '编辑相册' : '新增相册'" 
      width="95%" 
      :style="{ maxWidth: '1000px' }"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <!-- 基本信息 -->
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">相册名称 *</label>
          <el-input v-model="albumForm.name" placeholder="输入相册名称" clearable />
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">相册介绍</label>
          <el-input 
            v-model="albumForm.description" 
            type="textarea" 
            :rows="2" 
            placeholder="简单介绍一下这个相册（可选）" 
            clearable
          />
        </div>

        <!-- 选择图片 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">选择相册照片</label>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ albumForm.photos?.length || 0 }} 张 | 点击图片选择
            </span>
          </div>
          
          <div class="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <div class="max-h-[350px] overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800/50">
              <div v-if="availablePhotos.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                暂无图片
              </div>
              <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                <div
                  v-for="photo in availablePhotos"
                  :key="photo._id"
                  class="group relative cursor-pointer"
                  @click="togglePhotoSelection(photo._id)"
                >
                  <img
                    :src="getPhotoImageUrl(photo)"
                    :alt="photo.title || photo.originalFileName"
                    class="w-full aspect-square object-cover rounded transition-all duration-200"
                    :class="isPhotoSelected(photo._id) ? 'ring-2 ring-blue-500 brightness-75' : 'group-hover:brightness-75'"
                    loading="lazy"
                  />
                  
                  <!-- 选中指示 -->
                  <div v-if="isPhotoSelected(photo._id)" class="absolute inset-0 flex items-center justify-center rounded">
                    <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {{ getPhotoIndex(photo._id) + 1 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 已选择照片预览 -->
        <div v-if="albumForm.photos && albumForm.photos.length > 0">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            已选择 ({{ albumForm.photos.length }}) - 拖拽可调整顺序，第一张为封面
          </label>
          <div class="flex gap-2 overflow-x-auto pb-2 pt-4">
            <div
              v-for="(photoId, index) in albumForm.photos"
              :key="photoId"
              class="relative shrink-0 group cursor-move"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent="handleDragOver($event, index)"
              @drop.prevent="handlePhotoOrderDrop($event, index)"
              @dragend="handleDragEnd"
            >
              <img
                :src="getPhotoImageUrlById(photoId)"
                :alt="`第 ${index + 1} 张`"
                class="h-16 w-16 object-cover rounded border-2 transition-all pointer-events-none"
                :class="[index === 0 ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400', dragOverIndex === index && dragFromIndex !== index ? 'opacity-50' : '']"
                loading="lazy"
              />
              <div v-if="index === 0" class="absolute top-0.5 left-0.5 bg-blue-500 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium z-20">
                封面
              </div>
              <button
                type="button"
                class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                @click.stop="removePhotoFromSelection(photoId)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="reset" size="sm" @click="albumDialogVisible = false">取消</AppButton>
          <AppButton variant="primary" size="sm" :disabled="savingAlbum || !albumForm.name" @click="saveAlbum">
            {{ savingAlbum ? '保存中...' : '保存相册' }}
          </AppButton>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="photoDialogVisible" title="编辑照片" width="520px">
      <el-form :model="photoForm" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="photoForm.title" placeholder="请输入照片标题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <AppButton variant="reset" size="sm" @click="photoDialogVisible = false">取消</AppButton>
        <AppButton variant="primary" size="sm" :disabled="savingPhoto" @click="savePhoto">保存</AppButton>
      </template>
    </el-dialog>

    <!-- 地图位置选择对话框 -->
    <el-dialog 
      v-model="locationDialogVisible" 
      title="设置照片位置" 
      width="95%" 
      :style="{ maxWidth: '800px' }"
      :close-on-click-modal="false"
      :fullscreen="false"
    >
      <div class="space-y-3">
        <!-- 搜索栏 -->
        <div class="flex gap-2">
          <el-input 
            v-model="searchAddress" 
            placeholder="搜索地址，如：北京天安门" 
            @keyup.enter="searchLocation"
            clearable
            class="flex-1"
          >
            <template #prefix>
              <span class="text-gray-400">🔍</span>
            </template>
          </el-input>
          <AppButton 
            variant="primary" 
            size="sm"
            @click="searchLocation" 
            :disabled="searchingLocation"
            class="shrink-0"
          >
            {{ searchingLocation ? '搜索中' : '搜索' }}
          </AppButton>
        </div>
        
        <!-- 地图容器 -->
        <div class="relative">
          <div 
            ref="miniMapContainer" 
            class="w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
            :class="{
              'h-[400px] sm:h-[500px]': true
            }"
          ></div>
          <div class="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded px-2.5 py-1.5 shadow-md text-xs">
            <div class="flex items-center gap-1.5">
              <span>📍</span>
              <span class="font-mono text-gray-700 dark:text-gray-300" v-if="locationForm.latitude && locationForm.longitude">
                {{ locationForm.latitude.toFixed(4) }}, {{ locationForm.longitude.toFixed(4) }}
              </span>
              <span class="text-gray-500 dark:text-gray-400" v-else>点击选择</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="reset" size="sm" @click="locationDialogVisible = false">取消</AppButton>
          <AppButton variant="primary" size="sm" :disabled="savingLocation" @click="saveLocation">
            {{ savingLocation ? '保存中...' : '保存位置' }}
          </AppButton>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick } from 'vue'
import { Upload } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import { useUploadQueueStore } from '@/stores/uploadQueue'
import { storeToRefs } from 'pinia'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPhotoOriginalUrl } from '@/utils'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const activeTab = ref('photos')
const uploadQueueStore = useUploadQueueStore()
const { taskStats, failedTasks, failedLoading, queuedCount, uploadingCount } = storeToRefs(uploadQueueStore)

const photoTableData = ref<any[]>([])
const photoLoading = ref(false)
const photoPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const albumTableData = ref<any[]>([])
const albumLoading = ref(false)
const albumPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})
const albumDialogVisible = ref(false)
const savingAlbum = ref(false)
const albumForm = ref({
  _id: '',
  name: '',
  description: '',
  photos: [],
  type: 'normal',
  visibility: 'public',
})
const availablePhotos = ref<any[]>([])
const photoImageCache = ref<Map<string, string>>(new Map())
const dragFromIndex = ref(-1)
const dragOverIndex = ref(-1)
const selectedPhotos = ref<any[]>([])

const photoDialogVisible = ref(false)
const savingPhoto = ref(false)
const photoForm = ref({
  _id: '',
  title: '',
})

const locationDialogVisible = ref(false)
const savingLocation = ref(false)
const searchingLocation = ref(false)
const searchAddress = ref('')
const miniMapContainer = ref<HTMLDivElement | null>(null)
const locationForm = ref({
  photoId: '',
  latitude: 0,
  longitude: 0,
})
let miniMap: any = null
let miniMapMarker: any = null


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

const formatDate = (value?: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

const formatFileSize = (size?: number) => {
  if (!size) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let current = size
  let idx = 0
  while (current >= 1024 && idx < units.length - 1) {
    current /= 1024
    idx += 1
  }
  return `${current.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

const getVisibilityLabel = (value?: string) => {
  const map: Record<string, string> = {
    public: '公开',
    unlisted: '不公开',
    private: '私密',
  }
  return map[value || ''] || (value || '-')
}

const getVisibilityTagType = (value?: string) => {
  const map: Record<string, string> = {
    public: 'success',
    unlisted: 'warning',
    private: 'info',
  }
  return map[value || ''] || ''
}

const getStatusTagType = (value?: string) => {
  const map: Record<string, string> = {
    completed: 'success',
    processing: 'warning',
    failed: 'danger',
  }
  return map[value || ''] || ''
}

const getLiveLabel = (value?: boolean | number) => {
  return value ? '是' : '否'
}

const getLiveTagType = (value?: boolean | number) => {
  return value ? 'success' : 'info'
}

const getPhotoThumb = (photo: any) => {
  return photo.originalUrl
}

const loadPhotos = async () => {
  photoLoading.value = true
  try {
    const res: any = await request.get('/photos', {
      params: {
        page: photoPagination.page,
        limit: photoPagination.pageSize,
      }
    })
    if (res?.success && res.data) {
      photoTableData.value = res.data.photos || []
      photoPagination.total = res.data.pagination?.total || 0
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载图片失败')
  } finally {
    photoLoading.value = false
  }
}

const deletePhoto = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认删除图片“${row.title || row.originalFileName || '未命名'}”吗？`, '删除图片', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.delete(`/photos/${row._id}`)
    ElMessage.success('删除成功')
    await loadPhotos()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedPhotos.value = selection
}

const batchDeletePhotos = async () => {
  if (selectedPhotos.value.length === 0) {
    ElMessage.warning('请先选择要删除的图片')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedPhotos.value.length} 张图片吗？此操作不可恢复。`,
      '批量删除图片',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const loading = ElMessage.info({ message: `正在删除 ${selectedPhotos.value.length} 张图片...`, duration: 0 })
    
    try {
      // 批量删除 - 发送 ID 数组到后端
      const ids = selectedPhotos.value.map(photo => photo._id)
      await request.post('/photos/batch-delete', { ids })
      
      loading.close()
      ElMessage.success(`成功删除 ${selectedPhotos.value.length} 张图片`)
      selectedPhotos.value = []
      await loadPhotos()
    } catch (error: any) {
      loading.close()
      ElMessage.error(error?.message || '批量删除失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const openPhotoDialog = (row?: any) => {
  if (row) {
    photoForm.value = {
      _id: row._id,
      title: row.title || '',
    }
  }
  photoDialogVisible.value = true
}

const savePhoto = async () => {
  if (!photoForm.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  
  savingPhoto.value = true
  try {
    await request.put(`/photos/${photoForm.value._id}`, {
      title: photoForm.value.title,
    })
    ElMessage.success('保存成功')
    photoDialogVisible.value = false
    await loadPhotos()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    savingPhoto.value = false
  }
}

const handlePhotoAction = async (command: string, row: any) => {
  if (command === 'rotate-clockwise') {
    await rotatePhotoImage(row, 90)
  } else if (command === 'rotate-counterclockwise') {
    await rotatePhotoImage(row, -90)
  } else if (command === 'refresh-exif') {
    await refreshPhotoExif(row)
  } else if (command === 'refresh-geoinfo') {
    await refreshPhotoGeoinfo(row)
  } else if (command === 'set-location') {
    openLocationDialog(row)
  }
}

const rotatePhotoImage = async (row: any, degree: number) => {
  const degreeText = degree > 0 ? '顺时针 90°' : '逆时针 90°'
  try {
    ElMessage.info(`正在旋转图片 (${degreeText})...`)
    
    // 直接调用后端 API 旋转
    const res: any = await request.post(`/photos/${row._id}/rotate`, {
      degree,
    })
    
    ElMessage.success('图片旋转成功')
    
    // 等待一秒再刷新，确保文件写入完成
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 清除图片 URL 缓存，添加时间戳强制刷新
    photoImageCache.value.clear()
    
    await loadPhotos()
  } catch (error: any) {
    console.error('旋转图片失败:', error)
    ElMessage.error(error?.message || '旋转失败，请重试')
  }
}

const refreshPhotoExif = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确认重新提取"${row.title || row.originalFileName}"的EXIF信息吗？`,
      '重新获取EXIF',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
    
    const loading = ElMessage.info({ message: '正在提取EXIF信息...', duration: 0 })
    try {
      await request.post(`/photos/${row._id}/refresh-exif`)
      loading.close()
      ElMessage.success('EXIF信息更新成功')
      await loadPhotos()
    } catch (error: any) {
      loading.close()
      ElMessage.error(error?.message || '更新失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const refreshPhotoGeoinfo = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确认重新获取"${row.title || row.originalFileName}"的地理位置信息吗？`,
      '重新获取位置信息',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
    
    const loading = ElMessage.info({ message: '正在获取位置信息...', duration: 0 })
    try {
      await request.post(`/photos/${row._id}/refresh-geoinfo`)
      loading.close()
      ElMessage.success('位置信息更新成功')
      await loadPhotos()
    } catch (error: any) {
      loading.close()
      ElMessage.error(error?.message || '更新失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const openLocationDialog = (row: any) => {
  locationForm.value = {
    photoId: row._id,
    latitude: row.location?.latitude || 39.9042, // 默认北京
    longitude: row.location?.longitude || 116.4074,
  }
  locationDialogVisible.value = true
  
  // 等待对话框打开后初始化地图
  nextTick(() => {
    initMiniMap()
  })
}

const initMiniMap = () => {
  if (!miniMapContainer.value) return
  
  // 如果已有地图，先销毁
  if (miniMap) {
    miniMap.remove()
    miniMap = null
  }
  
  miniMap = new maplibregl.Map({
    container: miniMapContainer.value,
    style: 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [locationForm.value.longitude, locationForm.value.latitude],
    zoom: 12
  })
  
  // 添加标记
  miniMapMarker = new maplibregl.Marker({ draggable: true })
    .setLngLat([locationForm.value.longitude, locationForm.value.latitude])
    .addTo(miniMap)
  
  // 监听标记拖动
  miniMapMarker.on('dragend', () => {
    const lngLat = miniMapMarker.getLngLat()
    locationForm.value.longitude = lngLat.lng
    locationForm.value.latitude = lngLat.lat
  })
  
  // 点击地图更新位置
  miniMap.on('click', (e: any) => {
    locationForm.value.longitude = e.lngLat.lng
    locationForm.value.latitude = e.lngLat.lat
    miniMapMarker.setLngLat([e.lngLat.lng, e.lngLat.lat])
  })
}

// 监听经纬度变化，更新地图标记
watch(() => [locationForm.value.latitude, locationForm.value.longitude], ([lat, lng]) => {
  if (miniMap && miniMapMarker && typeof lat === 'number' && typeof lng === 'number') {
    miniMapMarker.setLngLat([lng, lat])
    miniMap.flyTo({ center: [lng, lat], zoom: 12 })
  }
})

const searchLocation = async () => {
  if (!searchAddress.value.trim()) {
    ElMessage.warning('请输入搜索地址')
    return
  }
  
  searchingLocation.value = true
  try {
    // 使用 Nominatim API 进行地址搜索
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress.value)}&limit=1`
    )
    const data = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      locationForm.value.latitude = parseFloat(result.lat)
      locationForm.value.longitude = parseFloat(result.lon)
      ElMessage.success(`找到位置：${result.display_name}`)
    } else {
      ElMessage.warning('未找到该地址，请尝试其他关键词')
    }
  } catch (error: any) {
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    searchingLocation.value = false
  }
}

const saveLocation = async () => {
  if (typeof locationForm.value.latitude !== 'number' || typeof locationForm.value.longitude !== 'number') {
    ElMessage.warning('请输入有效的经纬度')
    return
  }
  
  savingLocation.value = true
  try {
    await request.post(`/photos/${locationForm.value.photoId}/location`, {
      latitude: locationForm.value.latitude,
      longitude: locationForm.value.longitude,
    })
    ElMessage.success('位置信息保存成功')
    locationDialogVisible.value = false
    await loadPhotos()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    savingLocation.value = false
  }
}

const loadAlbums = async () => {
  albumLoading.value = true
  try {
    const res: any = await request.get('/admin/albums', {
      params: {
        page: albumPagination.page,
        pageSize: albumPagination.pageSize,
      }
    })
    if (res?.success) {
      albumTableData.value = res.data || []
      albumPagination.total = res.meta?.total || 0
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载相册失败')
  } finally {
    albumLoading.value = false
  }
}

const openAlbumDialog = (album?: any) => {
  if (album) {
    albumForm.value = {
      _id: album._id,
      name: album.name || '',
      description: album.description || '',
      photos: album.photos?.map((p: any) => p._id || p) || [],
      type: album.type || 'normal',
      visibility: album.visibility || 'public',
    }
  } else {
    albumForm.value = {
      _id: '',
      name: '',
      description: '',
      photos: [],
      type: 'normal',
      visibility: 'public',
    }
  }
  // 加载所有可用的图片
  loadAvailablePhotos()
  albumDialogVisible.value = true
}

const loadAvailablePhotos = async () => {
  try {
    const res: any = await request.get('/photos', {
      params: {
        page: 1,
        limit: 1000, // 加载足够多的图片
      }
    })
    if (res?.success && res.data) {
      availablePhotos.value = res.data.photos || []
    }
  } catch (error) {
    console.error('加载图片失败:', error)
  }
}

const isPhotoSelected = (photoId: string) => {
  return albumForm.value.photos?.includes(photoId) || false
}

const getPhotoIndex = (photoId: string) => {
  return albumForm.value.photos?.indexOf(photoId) || -1
}

const togglePhotoSelection = (photoId: string) => {
  if (!albumForm.value.photos) {
    albumForm.value.photos = []
  }
  
  const index = albumForm.value.photos.indexOf(photoId)
  if (index > -1) {
    albumForm.value.photos.splice(index, 1)
  } else {
    albumForm.value.photos.push(photoId)
  }
}

const handleDragStart = (e: DragEvent, index: number) => {
  dragFromIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragOver = (e: DragEvent, index: number) => {
  e.preventDefault()
  dragOverIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

const handlePhotoOrderDrop = (e: DragEvent, index: number) => {
  e.preventDefault()
  if (dragFromIndex.value !== -1 && dragFromIndex.value !== index && albumForm.value.photos) {
    const photos = albumForm.value.photos
    const [removed] = photos.splice(dragFromIndex.value, 1)
    photos.splice(index, 0, removed)
    dragFromIndex.value = -1
    dragOverIndex.value = -1
  }
}

const handleDragEnd = () => {
  dragFromIndex.value = -1
  dragOverIndex.value = -1
}

const removePhotoFromSelection = (photoId: string) => {
  const index = albumForm.value.photos?.indexOf(photoId) || -1
  if (index > -1) {
    albumForm.value.photos?.splice(index, 1)
  }
}

const getPhotoImageUrl = (photo: any) => {
  return getPhotoOriginalUrl(photo)
}

const getPhotoImageUrlById = (photoId: string) => {
  const photo = availablePhotos.value.find((p: any) => p._id === photoId)
  return photo ? getPhotoOriginalUrl(photo) : ''
}

const getPhotoById = (photoId: string) => {
  return availablePhotos.value.find((p: any) => p._id === photoId)
}

const saveAlbum = async () => {
  if (!albumForm.value.name) {
    ElMessage.warning('请输入相册名称')
    return
  }
  savingAlbum.value = true
  try {
    if (albumForm.value._id) {
      await request.put(`/admin/albums/${albumForm.value._id}`, {
        name: albumForm.value.name,
        description: albumForm.value.description,
        photos: albumForm.value.photos,
      })
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/albums', {
        name: albumForm.value.name,
        description: albumForm.value.description,
        photos: albumForm.value.photos,
      })
      ElMessage.success('创建成功')
    }
    albumDialogVisible.value = false
    await loadAlbums()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    savingAlbum.value = false
  }
}

const deleteAlbum = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认删除相册“${row.name}”吗？`, '删除相册', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.delete(`/admin/albums/${row._id}`)
    ElMessage.success('删除成功')
    await loadAlbums()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

onMounted(() => {
  uploadQueueStore.loadTaskStats()
  uploadQueueStore.loadFailedTasks()
  loadPhotos()
  loadAlbums()
})
</script>

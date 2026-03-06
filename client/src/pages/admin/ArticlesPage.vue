<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <!-- 页面头部 - 固定 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">文章管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">创建、编辑和管理你的文章内容</p>
    </div>

    <!-- 操作按钮 - 固定 -->
    <div class="flex-shrink-0 mb-6 flex gap-3">
      <AppButton
        variant="primary"
        @click="showDialog = true"
        :disabled="loading"
      >
        <Plus class="w-5 h-5" />
        新建文章
      </AppButton>
    </div>

    <!-- 文章列表卡片 - 可滚动区域 -->
    <div class="flex-1 overflow-y-auto space-y-4 pr-2 relative">
      <!-- 加载状态 -->
      <div v-if="loading" class="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
          <p class="text-sm text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && articleList.length === 0" class="flex items-center justify-center h-64">
        <div class="text-center">
          <FileText class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">暂无文章，点击新建文章开始创建</p>
        </div>
      </div>

      <!-- 文章列表 -->
      <template v-if="!loading && articleList.length > 0">
        <div
          v-for="article in displayedArticles"
          :key="article._id"
          class="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <!-- 封面图 -->
          <div v-if="article.coverImage" class="w-full h-48 overflow-hidden bg-slate-100 dark:bg-slate-700">
            <img :src="article.coverImage" :alt="article.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          
          <div class="p-6">
            <!-- 标题和状态 -->
            <div class="flex items-start justify-between mb-3">
              <h2 class="text-xl font-bold text-slate-950 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {{ article.title }}
              </h2>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  article.status === 'published'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                ]"
              >
                {{ article.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </div>

            <!-- 摘要 -->
            <p class="text-slate-700 dark:text-slate-300 mb-4 line-clamp-2">
              {{ article.summary || '暂无摘要' }}
            </p>

            <!-- 元信息 -->
            <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
              <span class="flex items-center gap-1">
                <Eye class="w-4 h-4" />
                {{ article.views }} 次浏览
              </span>
              <span class="flex items-center gap-1">
                <Heart class="w-4 h-4" />
                {{ article.likes }} 个赞
              </span>
              <span v-if="article.publishedAt">
                发布: {{ formatDate(article.publishedAt) }}
              </span>
              <span v-if="article.updatedAt && article.updatedAt !== article.createdAt" class="text-amber-600 dark:text-amber-400">
                更新: {{ formatDate(article.updatedAt) }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="flex flex-wrap items-center gap-2 sm:gap-3">
              <AppButton
                variant="custom"
                size="sm"
                class="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-800"
                @click="continueEdit(article)"
              >
                <Edit class="w-4 h-4" />
                <span class="hidden sm:inline">继续编辑</span>
              </AppButton>
              <AppButton
                variant="custom"
                size="sm"
                class="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800"
                @click="editArticle(article)"
              >
                <Edit class="w-4 h-4" />
                <span class="hidden sm:inline">编辑</span>
              </AppButton>
              <AppButton
                variant="custom"
                size="sm"
                :class="[
                  article.isTop
                    ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                ]"
                @click="toggleTop(article)"
              >
                <Pin class="w-4 h-4" />
                <span class="hidden sm:inline">{{ article.isTop ? '取消置顶' : '置顶' }}</span>
              </AppButton>
              <AppButton
                variant="custom"
                size="sm"
                :class="[
                  article.status === 'published'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                    : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 border-green-200 dark:border-green-800'
                ]"
                @click="togglePublish(article)"
              >
                <Send class="w-4 h-4" />
                <span class="hidden sm:inline">{{ article.status === 'published' ? '取消发布' : '发布' }}</span>
              </AppButton>
              <AppButton
                variant="danger"
                size="sm"
                @click="deleteArticle(article._id)"
              >
                <Trash2 class="w-4 h-4" />
                <span class="hidden sm:inline">删除</span>
              </AppButton>
            </div>
          </div>
        </div>
      </template>

      <!-- 加载更多按钮 -->
      <div v-if="hasMore && !loading" class="flex justify-center py-6">
        <AppButton
          variant="primary"
          @click="loadMore"
          :disabled="loading"
        >
          加载更多
        </AppButton>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50" :class="{ 'z-[9998]': isEditorFullscreen }">
      <div class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <!-- 对话框头部 - 固定 -->
        <div class="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h2 class="text-2xl font-bold text-slate-950 dark:text-slate-50">
              {{ editingArticle ? (isQuickEdit ? '快速编辑' : '编辑文章') : '新建文章' }}
            </h2>
            <span v-if="saveStatus === 'saving'" class="text-sm text-amber-600 dark:text-amber-400">
              保存中...
            </span>
            <span v-else-if="saveStatus === 'saved'" class="text-sm text-green-600 dark:text-green-400">
              已保存
            </span>
            <span v-else-if="saveStatus === 'error'" class="text-sm text-red-600 dark:text-red-400">
              保存失败
            </span>
          </div>
          <AppButton
            variant="custom"
            size="none"
            @click="handleCloseDialog"
            class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X class="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </AppButton>
        </div>

        <!-- 对话框内容 - 可滚动 -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- 快速编辑模式：只显示标题和内容 -->
          <template v-if="isQuickEdit">
            <!-- 内容编辑器 -->
            <div>
              <QuillEditor
                v-model="form.content"
                placeholder="请输入文章内容..."
                :height="400"
                :auto-fullscreen="shouldAutoFullscreen"
                @change="handleContentChange"
                @fullscreen-change="handleFullscreenChange"
              />
            </div>
          </template>

          <!-- 完整编辑模式 -->
          <template v-else>
          <!-- 标题 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              文章标题 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="请输入文章标题"
              class="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 caret-slate-900 dark:caret-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- 封面图 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              封面图片
            </label>
            <ImageUpload
              v-model="form.coverImage"
              placeholder="上传封面图"
              tip="建议尺寸：800x450px，最大 5MB"
              :max-size="5"
            />
          </div>

          <!-- 分类 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                分类
              </label>
              <input
                v-model="form.category"
                type="text"
                placeholder="如：技术、生活"
                class="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 caret-slate-900 dark:caret-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                标签
              </label>
              <input
                v-model="form.tags"
                type="text"
                placeholder="使用逗号分隔，如：tag1,tag2"
                class="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 caret-slate-900 dark:caret-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- 摘要 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              摘要
            </label>
            <textarea
              v-model="form.summary"
              placeholder="请输入文章摘要（可选）"
              rows="3"
              class="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 caret-slate-900 dark:caret-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <!-- 发布时间和更新时间 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                发布时间
              </label>
              <input
                v-model="form.publishedAt"
                type="datetime-local"
                class="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">留空则使用当前时间</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                最后更新
              </label>
              <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 text-sm">
                {{ form.updatedAt ? formatDateTime(form.updatedAt) : '尚未保存' }}
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">自动记录，不可修改</p>
            </div>
          </div>

          <!-- 内容编辑器 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              文章内容 <span class="text-red-500">*</span>
            </label>
            <QuillEditor
              v-model="form.content"
              placeholder="请输入文章内容..."
              :height="400"
              :auto-fullscreen="shouldAutoFullscreen"
              @change="handleContentChange"
              @fullscreen-change="handleFullscreenChange"
            />
          </div>
          </template>
        </div>

        <!-- 对话框底部 - 固定 -->
        <div class="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <template v-if="isQuickEdit">
            <AppButton
              variant="reset"
              size="sm"
              @click="handleCloseDialog"
            >
              取消
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              @click="saveArticle"
              :disabled="saveStatus === 'saving' || !form.title.trim() || !form.content.trim()"
            >
              <Save class="w-4 h-4" />
              保存
            </AppButton>
          </template>
          <template v-else>
            <AppButton
              variant="reset"
              size="sm"
              @click="handleCloseDialog"
            >
              取消
            </AppButton>
            <AppButton
              variant="custom"
              size="sm"
              class="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
              @click="autoSave"
              :disabled="saveStatus === 'saving' || !form.title.trim() || !form.content.trim()"
            >
              <Save class="w-4 h-4" />
              保存草稿
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              @click="saveArticle"
              class="order-1 sm:order-2"
              :disabled="saveStatus === 'saving'"
            >
              保存并关闭
            </AppButton>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Plus, Edit, Send, Trash2, Heart, Eye, FileText, X, Pin, Save } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppButton from '@/components/ui/AppButton.vue'
import QuillEditor from '@/components/ui/QuillEditor.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import request from '@/api/request'
import { formatDate, formatDateShort } from '@/utils/format'

interface Article {
  _id: string
  title: string
  content: string
  coverImage?: string
  summary?: string
  category?: string
  tags: string[]
  status: 'draft' | 'published'
  isTop: boolean
  views: number
  likes: number
  createdAt: string
  publishedAt?: string
  updatedAt?: string
}

const showDialog = ref(false)
const editingArticle = ref<Article | null>(null)
const articleList = ref<Article[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalArticles = ref(0)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const isEditorFullscreen = ref(false)
const hasUnsavedChanges = ref(false)
const shouldAutoFullscreen = ref(false)
const isQuickEdit = ref(false)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

// 计算是否有更多文章
const hasMore = computed(() => articleList.value.length < totalArticles.value)

// 计算显示的文章（限制DOM节点数量）
const displayedArticles = computed(() => articleList.value)

const form = ref({
  title: '',
  content: '',
  coverImage: '',
  summary: '',
  category: '',
  tags: '',
  publishedAt: '',
  updatedAt: '',
})

const fetchArticles = async (page: number = 1) => {
  try {
    loading.value = true
    const response = await request.get('/admin/articles', {
      params: {
        page,
        limit: pageSize.value
      }
    })
    
    const articles = (response as any).data || []
    const meta = (response as any).meta || {}
    
    if (page === 1) {
      articleList.value = articles
    } else {
      articleList.value.push(...articles)
    }
    
    totalArticles.value = meta.total || 0
    currentPage.value = meta.page || page
  } catch (error: any) {
    ElMessage.error('获取文章列表失败')
    console.error('获取文章失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  await fetchArticles(currentPage.value + 1)
}

const formatDateTime = formatDateShort

const editArticle = (article: Article) => {
  editingArticle.value = article
  form.value = {
    title: article.title,
    content: article.content,
    coverImage: article.coverImage || '',
    summary: article.summary || '',
    category: article.category || '',
    tags: Array.isArray(article.tags) ? article.tags.join(',') : '',
    publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 16) : '',
    updatedAt: article.updatedAt || '',
  }
  hasUnsavedChanges.value = false
  saveStatus.value = 'idle'
  shouldAutoFullscreen.value = false
  isQuickEdit.value = false
  showDialog.value = true
}

const continueEdit = (article: Article) => {
  editingArticle.value = article
  form.value = {
    title: article.title,
    content: article.content,
    coverImage: article.coverImage || '',
    summary: article.summary || '',
    category: article.category || '',
    tags: Array.isArray(article.tags) ? article.tags.join(',') : '',
    publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 16) : '',
    updatedAt: article.updatedAt || '',
  }
  hasUnsavedChanges.value = false
  saveStatus.value = 'idle'
  shouldAutoFullscreen.value = true
  isQuickEdit.value = true
  showDialog.value = true
}

const handleContentChange = () => {
  hasUnsavedChanges.value = true
  saveStatus.value = 'idle'
  
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = setTimeout(() => {
    if (hasUnsavedChanges.value && form.value.title.trim() && form.value.content.trim()) {
      autoSave()
    }
  }, 3000)
}

const handleFullscreenChange = (fullscreen: boolean) => {
  isEditorFullscreen.value = fullscreen
  if (fullscreen) {
    shouldAutoFullscreen.value = false
  }
}

const autoSave = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    return
  }

  try {
    saveStatus.value = 'saving'
    const articleData = {
      ...form.value,
      tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
      status: editingArticle.value?.status || 'draft'
    }

    if (editingArticle.value) {
      await request.put(`/admin/articles/${editingArticle.value._id}`, articleData)
    } else {
      const response = await request.post('/admin/articles', articleData)
      editingArticle.value = (response as any).data
    }

    saveStatus.value = 'saved'
    hasUnsavedChanges.value = false
    
    setTimeout(() => {
      if (saveStatus.value === 'saved') {
        saveStatus.value = 'idle'
      }
    }, 2000)
  } catch (error: any) {
    saveStatus.value = 'error'
    setTimeout(() => {
      if (saveStatus.value === 'error') {
        saveStatus.value = 'idle'
      }
    }, 2000)
  }
}

const saveArticle = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('请输入文章内容')
    return
  }

  try {
    saveStatus.value = 'saving'
    const articleData = {
      ...form.value,
      tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    if (editingArticle.value) {
      await request.put(`/admin/articles/${editingArticle.value._id}`, articleData)
      ElMessage.success('文章更新成功')
    } else {
      await request.post('/admin/articles', articleData)
      ElMessage.success('文章创建成功')
    }

    saveStatus.value = 'saved'
    hasUnsavedChanges.value = false
    resetForm()
    showDialog.value = false
    fetchArticles()
  } catch (error: any) {
    saveStatus.value = 'error'
    ElMessage.error(error.response?.data?.message || '保存失败')
  }
}

const handleCloseDialog = async () => {
  if (hasUnsavedChanges.value) {
    try {
      const action = await ElMessageBox.confirm(
        '文章有未保存的更改，是否保存？',
        '提示',
        {
          confirmButtonText: '保存',
          cancelButtonText: '不保存',
          distinguishCancelAndClose: true,
          type: 'warning',
        }
      )
      
      if (action === 'confirm') {
        await saveArticle()
      } else {
        resetForm()
        showDialog.value = false
      }
    } catch (action: any) {
      if (action === 'cancel') {
        resetForm()
        showDialog.value = false
      }
    }
  } else {
    resetForm()
    showDialog.value = false
  }
}

const togglePublish = async (article: Article) => {
  try {
    await request.patch(`/admin/articles/${article._id}/toggle-publish`)
    ElMessage.success(article.status === 'published' ? '已取消发布' : '发布成功')
    fetchArticles(1)
  } catch (error: any) {
    ElMessage.error('操作失败')
  }
}

const toggleTop = async (article: Article) => {
  try {
    await request.patch(`/admin/articles/${article._id}/toggle-top`)
    ElMessage.success(article.isTop ? '已取消置顶' : '置顶成功')
    fetchArticles(1)
  } catch (error: any) {
    ElMessage.error('操作失败')
  }
}

const deleteArticle = async (id: string) => {
  if (!confirm('确定要删除这篇文章吗？')) return

  try {
    await request.delete(`/admin/articles/${id}`)
    ElMessage.success('删除成功')
    fetchArticles(1)
  } catch (error: any) {
    ElMessage.error('删除失败')
  }
}

const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    coverImage: '',
    summary: '',
    category: '',
    tags: '',
    publishedAt: '',
    updatedAt: '',
  }
  editingArticle.value = null
  hasUnsavedChanges.value = false
  saveStatus.value = 'idle'
  shouldAutoFullscreen.value = false
  isQuickEdit.value = false
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

watch([() => form.value.title, () => form.value.coverImage, () => form.value.summary, () => form.value.category, () => form.value.tags], () => {
  if (showDialog.value) {
    hasUnsavedChanges.value = true
  }
})

onMounted(() => {
  fetchArticles()
})
</script>

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
            <div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
              <span class="flex items-center gap-1">
                <Eye class="w-4 h-4" />
                {{ article.views }} 次浏览
              </span>
              <span class="flex items-center gap-1">
                <Heart class="w-4 h-4" />
                {{ article.likes }} 个赞
              </span>
              <span>
                {{ formatDate(article.createdAt) }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="flex flex-wrap items-center gap-2 sm:gap-3">
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
    <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <!-- 对话框头部 - 固定 -->
        <div class="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-950 dark:text-slate-50">
            {{ editingArticle ? '编辑文章' : '新建文章' }}
          </h2>
          <AppButton
            variant="custom"
            size="none"
            @click="showDialog = false"
            class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X class="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </AppButton>
        </div>

        <!-- 对话框内容 - 可滚动 -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
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

          <!-- 内容编辑器 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              文章内容 <span class="text-red-500">*</span>
            </label>
            <QuillEditor
              v-model="form.content"
              placeholder="请输入文章内容..."
              :height="400"
            />
          </div>
        </div>

        <!-- 对话框底部 - 固定 -->
        <div class="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <AppButton
            variant="reset"
            size="sm"
            @click="showDialog = false"
          >
            取消
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            @click="saveArticle"
            class="order-1 sm:order-2"
          >
            保存文章
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Edit, Send, Trash2, Heart, Eye, FileText, X, Pin } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import AppButton from '@/components/ui/AppButton.vue'
import QuillEditor from '@/components/ui/QuillEditor.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import request from '@/api/request'

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
}

const showDialog = ref(false)
const editingArticle = ref<Article | null>(null)
const articleList = ref<Article[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalArticles = ref(0)

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const editArticle = (article: Article) => {
  editingArticle.value = article
  form.value = {
    title: article.title,
    content: article.content,
    coverImage: article.coverImage || '',
    summary: article.summary || '',
    category: article.category || '',
    tags: Array.isArray(article.tags) ? article.tags.join(',') : '',
  }
  showDialog.value = true
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
    const articleData = {
      ...form.value,
      tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    if (editingArticle.value) {
      // 更新文章
      await request.put(`/admin/articles/${editingArticle.value._id}`, articleData)
      ElMessage.success('文章更新成功')
    } else {
      // 创建文章
      await request.post('/admin/articles', articleData)
      ElMessage.success('文章创建成功')
    }

    resetForm()
    showDialog.value = false
    fetchArticles()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
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
  }
  editingArticle.value = null
}

onMounted(() => {
  fetchArticles()
})
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <!-- 页面头部 - 固定 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">文章管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">创建、编辑和管理你的文章内容</p>
    </div>

    <!-- 操作按钮 - 固定 -->
    <div class="flex-shrink-0 mb-6 flex gap-3">
      <button
        @click="showDialog = true"
        class="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
      >
        <Plus class="w-5 h-5" />
        新建文章
      </button>
    </div>

    <!-- 文章列表卡片 - 可滚动区域 -->
    <div class="flex-1 overflow-y-auto space-y-4 pr-2">
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
          <div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
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

          <!-- 表态 -->
          <div class="mb-4">
            <EmojiReaction
              :target-id="article._id"
              target-type="article"
              :reactions="article.reactions || {}"
              :single-use="true"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-3">
            <button
              @click="editArticle(article)"
              class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-semibold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
            >
              <Edit class="w-4 h-4" />
              编辑
            </button>
            <button
              @click="toggleTop(article)"
              :class="[
                'inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors',
                article.isTop
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-900/60'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              ]"
            >
              <Pin class="w-4 h-4" />
              {{ article.isTop ? '取消置顶' : '置顶' }}
            </button>
            <button
              @click="togglePublish(article)"
              :class="[
                'inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors',
                article.status === 'published'
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                  : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/60'
              ]"
            >
              <Send class="w-4 h-4" />
              {{ article.status === 'published' ? '取消发布' : '发布' }}
            </button>
            <button
              @click="deleteArticle(article._id)"
              class="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
              <Trash2 class="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- 加载更多按钮 -->
      <div v-if="hasMore" class="flex justify-center py-6">
        <button
          @click="loadMore"
          :disabled="loading"
          class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="articleList.length === 0" class="text-center py-16">
        <FileText class="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
        <p class="text-slate-600 dark:text-slate-300 text-lg">
          暂无文章，点击"新建文章"开始创建
        </p>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <!-- 对话框头部 - 固定 -->
        <div class="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-950 dark:text-slate-50">
            {{ editingArticle ? '编辑文章' : '新建文章' }}
          </h2>
          <button
            @click="showDialog = false"
            class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X class="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
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
          <div class="grid grid-cols-2 gap-6">
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
        <div class="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 flex items-center justify-end gap-3">
          <button
            @click="showDialog = false"
            class="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button
            @click="saveArticle"
            class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            保存文章
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Edit, Send, Trash2, Heart, Eye, FileText, X, Pin } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import QuillEditor from '@/components/ui/QuillEditor.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import EmojiReaction from '@/components/EmojiReaction.vue'
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
  reactions?: Record<string, number>
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
    
    if (page === 1) {
      // 首次加载，替换列表
      articleList.value = response.data.articles || []
    } else {
      // 加载更多，追加到列表
      articleList.value.push(...(response.data.articles || []))
    }
    
    totalArticles.value = response.data?.pagination?.total || articleList.value.length
    currentPage.value = page
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

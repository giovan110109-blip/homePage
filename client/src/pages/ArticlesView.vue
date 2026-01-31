<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">文章列表</h1>
        <p class="text-gray-600 dark:text-gray-400">分享技术、生活与思考</p>
      </div>

      <!-- 搜索和筛选 -->
      <div class="mb-8 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 dark:border-white/20">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- 搜索框 -->
          <div class="flex-1 relative">
            <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索文章标题、内容..."
              class="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 分类筛选 -->
          <select
            v-model="selectedCategory"
            @change="handleSearch"
            class="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
          >
            <option value="">全部分类</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>

          <!-- 搜索按钮 -->
          <button
            @click="handleSearch"
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            搜索
          </button>
        </div>

        <!-- 标签云 -->
        <div v-if="tags.length > 0" class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="tag in tags"
            :key="tag"
            @click="filterByTag(tag)"
            class="px-3 py-1.5 text-sm rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            #{{ tag }}
          </button>
        </div>
      </div>

      <!-- 文章列表 -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-500 dark:text-gray-400 mt-4">加载中...</p>
      </div>

      <div v-else-if="articles.length === 0" class="text-center py-12">
        <FileText class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">暂无文章</p>
      </div>

      <div v-else class="space-y-6">
        <!-- 文章卡片 -->
        <article
          v-for="article in articles"
          :key="article._id"
          class="group bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl cursor-pointer"
          @click="viewArticle(article._id)"
        >
          <div class="md:flex">
            <!-- 封面图 -->
            <div v-if="article.coverImage" class="md:w-1/3 h-48 md:h-auto overflow-hidden">
              <img
                :src="article.coverImage"
                :alt="article.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <!-- 文章内容 -->
            <div class="p-6 flex-1 flex flex-col">
              <!-- 置顶标签 -->
              <div v-if="article.isTop" class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full mb-2 w-fit">
                <TrendingUp class="w-3 h-3" />
                置顶
              </div>

              <!-- 标题 -->
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-500 transition-colors">
                {{ article.title }}
              </h2>

              <!-- 摘要 -->
              <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {{ article.summary || '暂无摘要' }}
              </p>

              <!-- 元信息 -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <!-- 作者信息 -->
                <div class="flex items-center gap-2">
                  <img
                    v-if="article.author?.avatar"
                    :src="article.author.avatar"
                    :alt="article.author.name"
                    class="w-6 h-6 rounded-full"
                  />
                  <User v-else class="w-4 h-4" />
                  <span>{{ article.author?.name || 'Anonymous' }}</span>
                </div>

                <!-- 发布时间 -->
                <div class="flex items-center gap-1">
                  <Calendar class="w-4 h-4" />
                  <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                </div>

                <!-- 浏览量 -->
                <div class="flex items-center gap-1">
                  <Eye class="w-4 h-4" />
                  <span>{{ article.views }}</span>
                </div>
              </div>

              <!-- 分类和标签 -->
              <div class="flex flex-wrap items-center gap-2 mb-4">
                <span v-if="article.category" class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                  {{ article.category }}
                </span>
                <span
                  v-for="tag in (article.tags || [])"
                  :key="tag"
                  class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                >
                  #{{ tag }}
                </span>
              </div>

              <!-- 底部操作区 - 表态、点赞、分享放在一排 -->
              <div class="flex items-center justify-between gap-4 mt-auto" @click.stop>
                <!-- 表态组件 -->
                <div class="flex-1">
                  <EmojiReaction
                    :target-id="article._id"
                    target-type="article"
                    :reactions="article.reactions || {}"
                    :single-use="true"
                  />
                </div>

                <!-- 右侧按钮组 -->
                <div class="flex items-center gap-3">
                  <!-- 点赞按钮 -->
                  <button
                    @click="handleLike(article)"
                    :disabled="isLiked(article._id)"
                    :class="[
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300',
                      isLiked(article._id)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-not-allowed'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    ]"
                  >
                    <Heart :class="{ 'fill-current': isLiked(article._id) }" class="w-4 h-4" />
                    <span>{{ article.likes }}</span>
                  </button>

                  <!-- 分享按钮 -->
                  <button
                    @click="shareArticle(article._id)"
                    class="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 font-medium transition-all duration-300"
                  >
                    <Share2 class="w-4 h-4" />
                    <span>分享</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.pages > 1" class="mt-12 flex justify-center">
        <div class="flex items-center gap-2">
          <button
            :disabled="pagination.page === 1"
            @click="changePage(pagination.page - 1)"
            class="px-4 py-2 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <div class="flex gap-2">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="[
                'px-4 py-2 rounded-lg transition-colors',
                page === pagination.page
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              ]"
            >
              {{ page }}
            </button>
          </div>

          <button
            :disabled="pagination.page === pagination.pages"
            @click="changePage(pagination.page + 1)"
            class="px-4 py-2 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Eye, Heart, Calendar, User, FileText, ChevronLeft, ChevronRight, TrendingUp, Share2 } from 'lucide-vue-next'
import EmojiReaction from '@/components/EmojiReaction.vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const router = useRouter()

interface Article {
  _id: string
  title: string
  content: string
  coverImage?: string
  summary?: string
  category?: string
  tags: string[]
  status: string
  author: {
    name: string
    avatar?: string
  }
  views: number
  likes: number
  reactions?: Record<string, number>
  publishedAt: string
  createdAt: string
  isTop: boolean
}

const articles = ref<Article[]>([])
const categories = ref<string[]>([])
const tags = ref<string[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const selectedCategory = ref('')
const likedArticles = ref<Set<string>>(new Set())

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
})

const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.pages
  const delta = 2
  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (current + delta < total - 1) {
    rangeWithDots.push('...', total)
  } else if (total > 1) {
    rangeWithDots.push(total)
  }

  return rangeWithDots.filter((v, i, a) => a.indexOf(v) === i)
})

const fetchArticles = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (selectedCategory.value) params.category = selectedCategory.value

    const response = await request.get('/articles', { params })
    articles.value = response.data.articles
    pagination.value = response.data.pagination
    loadLikedStatus()
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await request.get('/articles/categories')
    categories.value = response.data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const fetchTags = async () => {
  try {
    const response = await request.get('/articles/tags')
    tags.value = response.data
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchArticles()
}

const filterByTag = (tag: string) => {
  searchKeyword.value = tag
  handleSearch()
}

const changePage = (page: number | string) => {
  if (typeof page === 'number') {
    pagination.value.page = page
    fetchArticles()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const viewArticle = (id: string) => {
  router.push(`/articles/${id}`)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const isLiked = (articleId: string) => {
  return likedArticles.value.has(articleId)
}

const handleLike = async (article: Article) => {
  if (isLiked(article._id)) return

  try {
    await request.post(`/articles/${article._id}/like`)
    article.likes += 1
    likedArticles.value.add(article._id)
    localStorage.setItem(`article_liked_${article._id}`, 'true')
    ElMessage.success('点赞成功')
  } catch (error: any) {
    ElMessage.error(error.message || '点赞失败')
  }
}

const shareArticle = async (articleId: string) => {
  const url = `${window.location.origin}/articles/${articleId}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const loadLikedStatus = () => {
  const liked = new Set<string>()
  articles.value.forEach(article => {
    if (localStorage.getItem(`article_liked_${article._id}`) === 'true') {
      liked.add(article._id)
    }
  })
  likedArticles.value = liked
}

onMounted(() => {
  fetchArticles()
  fetchCategories()
  fetchTags()
})
</script>

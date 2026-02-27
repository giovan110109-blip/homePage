<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 文章内容 -->
      <article v-if="article || loading" class="bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/20 shadow-xl">
        <!-- 骨架屏 -->
        <div v-if="loading" class="animate-pulse">
          <div class="w-full h-96 bg-gray-300 dark:bg-gray-700"></div>
          <div class="p-8">
            <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div class="space-y-3">
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        
        <!-- 封面图 -->
        <div v-else-if="article?.coverImage" class="w-full h-96 overflow-hidden">
          <img
            :src="article.coverImage"
            :alt="article.title"
            class="w-full h-full object-cover"
          />
        </div>

        <div v-if="!loading" class="p-8">
          <!-- 文章头部 -->
          <div class="mb-8">
            <!-- 分类标签 -->
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <span v-if="article.category" class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full">
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

            <!-- 标题 -->
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {{ article.title }}
            </h1>

            <!-- 作者和元信息 -->
            <div class="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
              <!-- 作者 -->
              <div class="flex items-center gap-3">
                <img
                  v-if="article.author?.avatar"
                  :src="article.author.avatar"
                  :alt="article.author.name"
                  class="w-10 h-10 rounded-full"
                />
                <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {{ (article.author?.name || 'A').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ article.author?.name || 'Anonymous' }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-500">
                    {{ article.author?.bio || '作者' }}
                  </div>
                </div>
              </div>

              <!-- 发布时间 -->
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
              </div>

              <!-- 浏览量 -->
              <div class="flex items-center gap-2">
                <Eye class="w-4 h-4" />
                <span>{{ article.views }} 次浏览</span>
              </div>
            </div>
          </div>

          <!-- 分割线 -->
          <hr class="border-gray-200 dark:border-gray-700 mb-8" />

          <!-- 文章正文 -->
          <div
            class="prose prose-lg dark:prose-invert max-w-none mb-8"
            v-html="renderedContent"
          ></div>

          <!-- 分割线 -->
          <hr class="border-gray-200 dark:border-gray-700 mb-8" />

          <!-- 互动区域 -->
          <div class="flex items-center justify-between">
            <!-- 点赞按钮 -->
            <button
              @click="handleLike"
              :disabled="hasLiked"
              :class="[
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300',
                hasLiked
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-not-allowed'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              ]"
            >
              <Heart :class="{ 'fill-current': hasLiked }" class="w-5 h-5" />
              <span>{{ article.likes }} 个赞</span>
            </button>

            <!-- 分享按钮 -->
            <div class="flex items-center gap-2">
              <button
                @click="shareArticle"
                class="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 font-medium transition-all duration-300"
              >
                <Share2 class="w-5 h-5" />
                <span>分享</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      <!-- 文章不存在 -->
      <div v-else class="text-center py-12">
        <FileText class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400 mb-4">文章不存在或已被删除</p>
        <button
          @click="router.push('/articles')"
          class="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          返回文章列表
        </button>
      </div>

      <!-- 返回按钮 -->
      <div v-if="article" class="mt-8 text-center">
        <button
          @click="router.push('/articles')"
          class="inline-flex items-center gap-2 px-6 py-3 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/20 transition-all duration-300 text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft class="w-5 h-5" />
          返回列表
        </button>
      </div>
    </div>

    <!-- 分享卡片弹窗 -->
    <div v-if="showShareModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click="showShareModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full" @click.stop>
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">分享文章</h3>
          <p class="text-gray-600 dark:text-gray-400">选择分享方式</p>
        </div>

        <div class="space-y-3">
          <!-- 复制链接 -->
          <button
            @click="copyLink"
            class="w-full flex items-center gap-3 px-6 py-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
          >
            <Link class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white">复制链接</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">分享到任何地方</div>
            </div>
          </button>

          <!-- 生成分享卡片 -->
          <button
            @click="generateShareCard"
            class="w-full flex items-center gap-3 px-6 py-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
          >
            <Image class="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white">生成分享卡片</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">生成精美的分享图片</div>
            </div>
          </button>
        </div>

        <button
          @click="showShareModal = false"
          class="mt-6 w-full px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 分享卡片生成预览 -->
    <div v-if="showCardPreview" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click="showCardPreview = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full" @click.stop>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">分享卡片</h3>
        
        <!-- 卡片预览 -->
        <div id="share-card" class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-4">
          <div class="mb-6">
            <h2 class="text-2xl font-bold mb-2">{{ article?.title }}</h2>
            <p class="text-blue-100 text-sm line-clamp-3">{{ article?.summary || '暂无摘要' }}</p>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-white/20">
            <div class="flex items-center gap-2">
              <img
                v-if="article?.author?.avatar"
                :src="article.author.avatar"
                :alt="article.author.name"
                class="w-8 h-8 rounded-full"
              />
              <span class="text-sm">{{ article?.author?.name }}</span>
            </div>
            <div class="text-sm">{{ formatDate(article?.publishedAt || article?.createdAt) }}</div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="downloadCard"
            class="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            下载图片
          </button>
          <button
            @click="showCardPreview = false"
            class="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, Heart, Calendar, Share2, FileText, ArrowLeft, Link, Image } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import html2canvas from 'html2canvas'
import hljs from 'highlight.js'
import markdownit from 'markdown-it'
import { useArticleSeo } from '@/composables/useSeo'

const route = useRoute()
const router = useRouter()

interface Article {
  _id: string
  title: string
  content: string
  coverImage?: string
  summary?: string
  category?: string
  tags: string[]
  author: {
    name: string
    avatar?: string
    bio?: string
  }
  views: number
  likes: number
  publishedAt: string
  createdAt: string
}

const article = ref<Article | null>(null)
const loading = ref(false)
const hasLiked = ref(false)
const showShareModal = ref(false)
const showCardPreview = ref(false)

useArticleSeo(article)

const md = markdownit({
  html: false,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>'
      } catch (_) {
        return ''
      }
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

const isLikelyHtml = (input: string) => /<\/?[a-z][\s\S]*>/i.test(input)

const renderedContent = computed(() => {
  const content = article.value?.content || ''
  if (!content) return ''
  if (isLikelyHtml(content)) return content
  return md.render(content)
})

const applyHighlight = async () => {
  await nextTick()
  const blocks = document.querySelectorAll('.prose pre code')
  blocks.forEach((block) => {
    hljs.highlightElement(block as HTMLElement)
  })
  addCopyButtons()
}

const addCopyButtons = () => {
  const pres = document.querySelectorAll('.prose pre')
  pres.forEach((pre) => {
    const container = pre as HTMLElement
    if (container.dataset.copyReady === '1') return
    container.dataset.copyReady = '1'
    container.classList.add('code-block')

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'code-copy-btn'
    btn.innerHTML = `
      <svg class="code-copy-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z"/>
      </svg>
    `
    btn.addEventListener('click', async () => {
      const code = container.querySelector('code')?.textContent ?? ''
      try {
        await navigator.clipboard.writeText(code)
        btn.innerHTML = `
          <svg class="code-copy-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
          </svg>
        `
        setTimeout(() => {
          btn.innerHTML = `
            <svg class="code-copy-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z"/>
            </svg>
          `
        }, 1500)
      } catch (_) {
        btn.innerHTML = `
          <svg class="code-copy-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 10.6 7.8 6.4 6.4 7.8 10.6 12l-4.2 4.2 1.4 1.4 4.2-4.2 4.2 4.2 1.4-1.4L13.4 12l4.2-4.2-1.4-1.4z"/>
          </svg>
        `
        setTimeout(() => {
          btn.innerHTML = `
            <svg class="code-copy-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z"/>
            </svg>
          `
        }, 1500)
      }
    })

    container.appendChild(btn)
  })
}

const fetchArticle = async () => {
  try {
    loading.value = true
    const response = await request.get(`/articles/${route.params.id}`)
    article.value = response.data
    
    // 检查是否已点赞
    const likedKey = `article_liked_${route.params.id}`
    hasLiked.value = localStorage.getItem(likedKey) === 'true'
  } catch (error: any) {
    console.error('获取文章详情失败:', error)
    ElMessage.error(error.response?.data?.message || '获取文章失败')
  } finally {
    loading.value = false
    await applyHighlight()
  }
}

const handleLike = async () => {
  if (hasLiked.value) return

  try {
    await request.post(`/articles/${route.params.id}/like`)
    if (article.value) {
      article.value.likes += 1
    }
    hasLiked.value = true
    localStorage.setItem(`article_liked_${route.params.id}`, 'true')
    ElMessage.success('点赞成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '点赞失败')
  }
}

const shareArticle = () => {
  showShareModal.value = true
}

const copyLink = async () => {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
    showShareModal.value = false
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const generateShareCard = () => {
  showShareModal.value = false
  showCardPreview.value = true
}

const downloadCard = async () => {
  try {
    const element = document.getElementById('share-card')
    if (!element) return

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: null
    })

    const link = document.createElement('a')
    link.download = `${article.value?.title || 'article'}-share-card.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    ElMessage.success('分享卡片已下载')
  } catch (error) {
    ElMessage.error('生成分享卡片失败')
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

watch(
  () => article.value?.content,
  () => {
    if (!loading.value) {
      applyHighlight()
    }
  }
)

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.prose {
  color: inherit;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  color: inherit;
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.prose :deep(p) {
  margin-bottom: 1em;
  line-height: 1.75;
}

.prose :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.prose :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.5em 0;
}

.prose :deep(pre) {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1.25rem 1.25rem 1.5rem;
  border-radius: 0.75rem;
  overflow-x: auto;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);
}

.prose :deep(pre.code-block) {
  position: relative;
}

.prose :deep(.code-copy-btn) {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.4rem;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.prose :deep(.code-copy-btn:hover) {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.3);
}

.dark .prose :deep(.code-copy-btn) {
  background: rgba(15, 23, 42, 0.85);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.55);
}

.dark .prose :deep(.code-copy-btn:hover) {
  background: rgba(30, 41, 59, 0.9);
}

.prose :deep(.code-copy-icon) {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.prose :deep(code) {
  background: #f3f4f6;
  color: #1f2937;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.prose :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  color: #6b7280;
  font-style: italic;
}

.dark .prose :deep(code) {
  background: #374151;
  color: #f3f4f6;
}

.dark .prose :deep(a) {
  color: #60a5fa;
}
</style>

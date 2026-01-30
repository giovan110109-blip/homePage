<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-16">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">友情链接</h1>
        <p class="text-gray-600 dark:text-gray-400">欢迎交换友情链接，一起分享精彩内容</p>
      </div>

      <!-- 友情链接展示区域 -->
      <div class="mb-20">
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-gray-500 dark:text-gray-400 mt-4">加载中...</p>
        </div>

        <div v-else-if="friendLinks.length === 0" class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">暂无友情链接</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            v-for="link in friendLinks"
            :key="link._id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            @click="handleLinkClick(link._id)"
            class="group relative bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 dark:border-white/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div class="flex items-start space-x-4">
              <!-- 头像 -->
              <div class="flex-shrink-0">
                <img
                  v-if="link.avatar"
                  :src="link.avatar"
                  :alt="link.name"
                  class="w-14 h-14 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-400"
                />
                <div
                  v-else
                  class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold"
                >
                  {{ link.name.charAt(0).toUpperCase() }}
                </div>
              </div>

              <!-- 信息 -->
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white mb-1 truncate group-hover:text-blue-500">
                  {{ link.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {{ link.description }}
                </p>
                <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                  <span v-if="link.category" class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    {{ link.category }}
                  </span>
                  <span v-if="link.clicks > 0" class="flex items-center">
                    <Eye class="w-3 h-3 mr-1" />
                    {{ link.clicks }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 外部链接图标 -->
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink class="w-4 h-4 text-gray-400" />
            </div>
          </a>
        </div>
      </div>

      <!-- 申请友情链接表单 -->
      <div class="max-w-2xl mx-auto">
        <div class="bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-white/20 shadow-xl">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">申请友情链接</h2>
          
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                网站名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="您的网站名称"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                网站链接 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.url"
                type="url"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                网站描述 <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="form.description"
                required
                rows="3"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="简短介绍您的网站（建议 50 字以内）"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                网站头像/Logo URL
              </label>
              <input
                v-model="form.avatar"
                type="url"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                联系邮箱 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RSS 订阅地址（可选）
              </label>
              <input
                v-model="form.rss"
                type="url"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com/rss.xml"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                网站分类
              </label>
              <select
                v-model="form.category"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="tech">技术博客</option>
                <option value="design">设计</option>
                <option value="life">生活</option>
                <option value="tools">工具</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div class="flex items-center justify-end space-x-4">
              <button
                type="button"
                @click="resetForm"
                class="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                重置
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {{ submitting ? '提交中...' : '提交申请' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Eye, ExternalLink } from 'lucide-vue-next'
import { getFriendLinks, applyFriendLink, recordFriendLinkClick } from '@/api/friendLink'
import type { FriendLink, FriendLinkFormData } from '@/types/api'

const loading = ref(false)
const submitting = ref(false)
const friendLinks = ref<FriendLink[]>([])

const form = ref<FriendLinkFormData>({
  name: '',
  url: '',
  description: '',
  avatar: '',
  email: '',
  rss: '',
  category: 'tech'
})

// 加载友情链接
const loadFriendLinks = async () => {
  loading.value = true
  try {
    const res = await getFriendLinks()
    friendLinks.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 记录点击
const handleLinkClick = async (id: string) => {
  try {
    await recordFriendLinkClick(id)
  } catch (error) {
    // 静默失败
  }
}

// 提交申请
const handleSubmit = async () => {
  submitting.value = true
  try {
    await applyFriendLink(form.value)
    ElMessage.success('申请已提交，请耐心等待审核')
    resetForm()
    // 可选：刷新列表
    // await loadFriendLinks()
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    url: '',
    description: '',
    avatar: '',
    email: '',
    rss: '',
    category: 'tech'
  }
}

onMounted(() => {
  loadFriendLinks()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

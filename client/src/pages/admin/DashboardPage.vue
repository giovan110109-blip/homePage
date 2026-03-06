<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <!-- 顶部标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">仪表板</h1>
      <p class="text-gray-500 dark:text-gray-400">实时数据概览与统计分析</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-96">
      <div class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
        <p class="text-gray-500 dark:text-gray-400">数据加载中...</p>
      </div>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <!-- Card: 访问数量 -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">访问数量</p>
                <div class="text-4xl font-bold text-gray-900 dark:text-white">{{ formatNumber(stats.access.total) }}</div>
              </div>
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <Eye class="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="text-xs" :class="getGrowthClass(stats.access.growth)">
              <span>{{ stats.access.growth }}</span>
              <span class="text-gray-500 dark:text-gray-400 ml-1">相比上周</span>
            </div>
          </div>
        </div>

        <!-- Card: 新增留言 -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">新增留言</p>
                <div class="text-4xl font-bold text-gray-900 dark:text-white">{{ stats.messages.new }}</div>
              </div>
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <MessageSquare class="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              总留言：<span class="font-semibold text-gray-700 dark:text-gray-300">{{ stats.messages.total }}</span>
            </div>
          </div>
        </div>

        <!-- Card: 点赞总数 -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">点赞总数</p>
                <div class="text-4xl font-bold text-gray-900 dark:text-white">{{ stats.reactions.total }}</div>
              </div>
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                <Heart class="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div class="text-xs" :class="getGrowthClass(stats.reactions.growth)">
              <span>{{ stats.reactions.growth }}</span>
              <span class="text-gray-500 dark:text-gray-400 ml-1">相比上周</span>
            </div>
          </div>
        </div>

        <!-- Card: 图片总数 -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">图片总数</p>
                <div class="text-4xl font-bold text-gray-900 dark:text-white">{{ stats.photos.total }}</div>
              </div>
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <Image class="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              新增：<span class="font-semibold text-gray-700 dark:text-gray-300">{{ stats.photos.new }}</span> 张
            </div>
          </div>
        </div>

        <!-- Card: 发布文章 -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">发布文章</p>
                <div class="text-4xl font-bold text-gray-900 dark:text-white">{{ stats.articles.published }}</div>
              </div>
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                <FileText class="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              草稿：<span class="font-semibold text-gray-700 dark:text-gray-300">{{ stats.articles.draft }}</span> 篇
            </div>
          </div>
        </div>
      </div>

      <!-- Reactions Distribution Card -->
      <div class="group relative mb-6">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl blur-xl opacity-10 group-hover:opacity-15 transition-all duration-300"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center gap-3 mb-8">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
              <Zap class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">反应分布</h2>
            <span class="ml-auto text-sm text-gray-500 dark:text-gray-400">共 {{ stats.reactions.total }} 个互动</span>
          </div>

          <div v-if="Object.keys(stats.reactions.byType).length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div 
              v-for="(count, type) in stats.reactions.byType" 
              :key="type"
              class="group/item flex flex-col items-center justify-center p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <div class="text-4xl mb-2 group-hover/item:scale-125 transition-transform duration-300">{{ getReactionEmoji(type) }}</div>
              <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{{ count }}</div>
              <div class="text-xs font-medium text-slate-600 dark:text-slate-300">{{ getReactionLabel(type) }}</div>
            </div>
          </div>
          <div v-else class="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p>暂无互动数据</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Eye, Users, MessageSquare, Heart, Image, FileText, Zap } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import { getDashboardStats, type DashboardStats } from "@/api/dashboard";
import { ElMessage } from 'element-plus';

const loading = ref(false);
const stats = ref<DashboardStats>({
  messages: { total: 0, new: 0, growth: '↑ 0%' },
  articles: { total: 0, published: 0, draft: 0 },
  photos: { total: 0, new: 0, growth: '↑ 0%' },
  reactions: { total: 0, new: 0, growth: '↑ 0%', byType: {} },
  access: { total: 0, new: 0, growth: '↑ 0%' }
});

// 表情映射
const reactionEmojis: Record<string, string> = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠',
  fire: '🔥',
  star: '⭐',
  thinking: '🤔',
  clap: '👏',
  pray: '🙏',
  party: '🎉',
  cool: '😎',
  sweat: '😅',
  kiss: '😘',
  tease: '😜',
  sweet: '😘',
  sick: '🤮'
};

const reactionLabels: Record<string, string> = {
  like: '赞',
  love: '爱',
  laugh: '笑',
  wow: '惊',
  sad: '伤',
  angry: '怒',
  fire: '火',
  star: '星',
  thinking: '思',
  clap: '鼓',
  pray: '祈',
  party: '趴',
  cool: '酷',
  sweat: '汗',
  kiss: '吻',
  tease: '逗',
  sweet: '甜',
  sick: '呕'
};

const getReactionEmoji = (type: string): string => {
  return reactionEmojis[type] || '👍';
};

const getReactionLabel = (type: string): string => {
  return reactionLabels[type] || type;
};

const fetchStats = async () => {
  loading.value = true;
  try {
    const response = await getDashboardStats();
    if (response.data) {
      stats.value = response.data;
    }
  } catch (error) {
    ElMessage.error('加载统计数据失败');
    console.error('Failed to fetch dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return String(num);
};

const getGrowthClass = (growth: string): string => {
  if (growth.startsWith('↑')) {
    return 'text-green-600 dark:text-green-400 font-medium';
  } else {
    return 'text-red-600 dark:text-red-400 font-medium';
  }
};

onMounted(() => {
  fetchStats();
});
</script>

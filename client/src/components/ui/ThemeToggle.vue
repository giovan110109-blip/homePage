<template>
  <button
    @click="toggleTheme"
    class="p-3 rounded-full bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-400/30 dark:border-gray-600/30 hover:bg-gray-300/60 dark:hover:bg-gray-700/60 transition-all duration-200 focus:outline-none group"
    :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
  >
    <div class="w-5 h-5 relative">
      <!-- 太阳图标 (浅色模式) -->
      <svg
        v-show="!isDark"
        class="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-200"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
        />
      </svg>
      
      <!-- 月亮图标 (深色模式) -->
      <svg
        v-show="isDark"
        class="w-5 h-5 text-blue-300 group-hover:text-blue-200 transition-colors duration-200"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          fill-rule="evenodd"
          d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme, isDark } = useTheme()
</script>

<style scoped>
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
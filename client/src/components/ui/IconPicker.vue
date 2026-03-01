<template>
  <el-popover
    v-model:visible="popoverVisible"
    placement="bottom-start"
    :width="400"
    trigger="click"
  >
    <template #reference>
      <div
        class="w-full h-10 px-3 flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
      >
        <component v-if="modelValue" :is="getIcon(modelValue)" class="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <span v-else class="text-gray-400">请选择图标</span>
        <span class="ml-auto text-gray-400 text-sm">{{ modelValue || '' }}</span>
      </div>
    </template>

    <div class="max-h-80 overflow-hidden flex flex-col">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索图标..."
        clearable
        class="mb-3"
      >
        <template #prefix>
          <Search class="w-4 h-4" />
        </template>
      </el-input>

      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-6 gap-2">
          <div
            v-for="icon in filteredIcons"
            :key="icon.name"
            class="aspect-square flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all hover:bg-primary-50 dark:hover:bg-primary-900/20"
            :class="{
              'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500': modelValue === icon.name
            }"
            :title="icon.name"
            @click="handleSelect(icon.name)"
          >
            <component :is="icon.component" class="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span class="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
              {{ icon.name }}
            </span>
          </div>
        </div>

        <div v-if="filteredIcons.length === 0" class="text-center py-8 text-gray-400">
          未找到匹配的图标
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const popoverVisible = ref(false)
const searchKeyword = ref('')

const iconNames = [
  'LayoutDashboard',
  'Users',
  'Shield',
  'Menu',
  'MessageSquare',
  'FileText',
  'Image',
  'Sparkles',
  'Link',
  'Activity',
  'Heart',
  'Settings',
  'Home',
  'User',
  'LogOut',
  'ChevronLeft',
  'ChevronRight',
  'Plus',
  'Edit',
  'Trash2',
  'Eye',
  'EyeOff',
  'Save',
  'X',
  'Check',
  'RefreshCw',
  'Upload',
  'Download',
  'Copy',
  'Clipboard',
  'Filter',
  'SortAsc',
  'SortDesc',
  'Calendar',
  'Clock',
  'MapPin',
  'Tag',
  'Star',
  'Bookmark',
  'Bell',
  'BellOff',
  'Mail',
  'Phone',
  'Globe',
  'Lock',
  'Unlock',
  'Key',
  'Wifi',
  'WifiOff',
  'Camera',
  'Video',
  'Music',
  'Mic',
  'Volume2',
  'VolumeX',
  'Play',
  'Pause',
  'ZoomIn',
  'ZoomOut',
  'Sun',
  'Moon',
  'Cloud',
  'Zap',
  'Flame',
  'Compass',
  'Navigation',
  'Target',
  'QrCode',
  'Fingerprint',
  'Award',
  'Trophy',
  'Medal',
  'Crown',
  'Gem',
  'Circle',
  'ThumbsUp',
  'ThumbsDown',
  'Flag',
  'Book',
  'BookOpen',
  'File',
  'FilePlus',
  'FileCheck',
  'Folder',
  'FolderOpen',
  'Database',
  'Server',
  'HardDrive',
  'Monitor',
  'Laptop',
  'Tablet',
  'Smartphone',
  'Watch',
  'Headphones',
  'Speaker',
  'Printer',
  'ShoppingBag',
  'ShoppingCart',
  'Store',
  'Building',
  'Building2',
  'House',
  'Bed',
  'Lamp',
  'Lightbulb',
  'Power',
  'Battery',
  'BatteryCharging',
  'Plug',
  'Gauge',
  'Timer',
  'Hourglass',
  'AlarmClock',
  'Search',
]

const icons = iconNames.map(name => ({
  name,
  component: (LucideIcons as any)[name] || LucideIcons.HelpCircle
}))

const filteredIcons = computed(() => {
  if (!searchKeyword.value) return icons
  const keyword = searchKeyword.value.toLowerCase()
  return icons.filter(icon => icon.name.toLowerCase().includes(keyword))
})

const getIcon = (name: string) => {
  const icon = icons.find(i => i.name === name)
  return icon?.component || LucideIcons.LayoutDashboard
}

const handleSelect = (name: string) => {
  emit('update:modelValue', name)
  popoverVisible.value = false
}
</script>

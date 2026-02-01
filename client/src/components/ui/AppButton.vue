<template>
  <button
    :type="nativeType"
    :disabled="disabled || loading"
    :class="buttonClass"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'reset' | 'submit' | 'check' | 'ghost-danger' | 'custom' | 'link-primary' | 'link-danger' | 'outline' | 'danger' | 'success'
  size?: 'lg' | 'md' | 'sm' | 'xs' | 'none'
  nativeType?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  nativeType: 'button',
  disabled: false,
  loading: false
})

defineEmits<{
  click: []
}>()

const buttonClass = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none'
  const sizeMap: Record<string, string> = {
    lg: 'px-8 py-4 text-base',
    md: 'px-6 py-3 text-sm',
    sm: 'px-4 py-2 text-sm',
    xs: 'px-3 py-1.5 text-xs',
    none: ''
  }
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg',
    submit: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg',
    reset: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-[#111827] dark:text-gray-200 dark:border-[#374151] dark:hover:bg-[#1f2937] transition-colors',
    check: 'bg-[#f0f9ff] border border-[#bfdbfe] text-[#0284c7] hover:bg-[#bfdbfe] hover:text-[#0c4a6e] dark:bg-[#082f49] dark:border-[#0e4a8b] dark:text-[#38bdf8] dark:hover:bg-[#0e4a8b] dark:hover:text-[#38bdf8]',
    'ghost-danger': 'p-1 bg-transparent text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-red-400',
    'link-primary': 'ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    'link-danger': 'ml-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300',
    outline: 'bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors',
    custom: ''
  }
  return [base, sizeMap[props.size], variants[props.variant]]
})
</script>

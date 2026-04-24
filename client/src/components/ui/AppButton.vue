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
  variant?: 'primary' | 'secondary' | 'ghost' | 'reset' | 'submit' | 'check' | 'ghost-danger' | 'custom' | 'link-primary' | 'link-danger' | 'outline' | 'danger' | 'success'
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
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none'
  const sizeMap: Record<string, string> = {
    lg: 'px-8 py-4 text-base',
    md: 'px-6 py-3 text-sm',
    sm: 'px-4 py-2 text-sm',
    xs: 'px-3 py-1.5 text-xs',
    none: ''
  }
  const variants: Record<string, string> = {
    primary: 'border-transparent bg-blue-600 text-white shadow-lg hover:bg-blue-700',
    secondary: 'theme-panel-soft text-gray-700 hover:bg-white',
    ghost: 'border-transparent bg-transparent text-gray-600 hover:bg-white/60',
    submit: 'border-transparent bg-blue-600 text-white shadow-lg hover:bg-blue-700',
    success: 'border-transparent bg-emerald-600 text-white shadow-lg hover:bg-emerald-700',
    danger: 'border-transparent bg-red-600 text-white shadow-lg hover:bg-red-700',
    reset: 'theme-panel-soft text-gray-700 hover:bg-white',
    check: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    'ghost-danger': 'border-transparent p-1 bg-transparent text-gray-400 hover:bg-red-100 hover:text-red-500',
    'link-primary': 'ml-2 border-transparent bg-transparent px-0 py-0 text-blue-600 shadow-none hover:text-blue-700',
    'link-danger': 'ml-2 border-transparent bg-transparent px-0 py-0 text-red-500 shadow-none hover:text-red-600',
    outline: 'theme-panel-soft text-gray-700 hover:bg-blue-50',
    custom: ''
  }
  return [base, sizeMap[props.size], variants[props.variant]]
})
</script>

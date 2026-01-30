<template>
  <div 
    ref="cardRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    :class="cardClasses"
  >
    <!-- 鼠标跟随效果 -->
    <div 
      v-if="showEffect"
      class="absolute w-40 h-40 rounded-full blur-2xl transition-all duration-75 ease-out pointer-events-none z-0"
      :style="{
        left: mouseX - 80 + 'px',
        top: mouseY - 80 + 'px',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.5) 0%, rgba(34, 197, 94, 0.25) 30%, rgba(34, 197, 94, 0.1) 60%, transparent 90%)',
        boxShadow: '0 0 60px rgba(34, 197, 94, 0.4), 0 0 120px rgba(34, 197, 94, 0.2)'
      }"
    ></div>
    
    <div v-if="$slots.header" class="relative z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <slot name="header" />
    </div>
    
    <div :class="contentClasses" class="relative z-10">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="relative z-10 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { clsx } from 'clsx'

const cardRef = ref<HTMLElement>()
const mouseX = ref(0)
const mouseY = ref(0)
const showEffect = ref(false)

const handleMouseMove = (event: MouseEvent) => {
  const card = cardRef.value
  if (!card) return
  
  const rect = card.getBoundingClientRect()
  mouseX.value = event.clientX - rect.left
  mouseY.value = event.clientY - rect.top
  showEffect.value = true
}

const handleMouseLeave = () => {
  showEffect.value = false
}

interface Props {
  variant?: 'default' | 'bordered' | 'shadow' | 'elevated' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  rounded: 'lg',
  hover: false
})

const cardClasses = computed(() => {
  const baseClasses = props.variant === 'glass' 
    ? 'relative overflow-hidden transition-all duration-200'
    : 'relative bg-white dark:bg-gray-800 overflow-hidden transition-all duration-200'
  
  const variantClasses = {
    default: 'border border-gray-200 dark:border-gray-700',
    bordered: 'border border-gray-300 dark:border-gray-600',
    shadow: 'border border-gray-200 dark:border-gray-700',
    elevated: 'border border-gray-200 dark:border-gray-700',
    glass: 'border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50'
  }
  
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  }
  
  const hoverClasses = props.hover ? 'hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer' : ''
  
  return clsx(
    baseClasses,
    variantClasses[props.variant],
    roundedClasses[props.rounded],
    hoverClasses
  )
})

const contentClasses = computed(() => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  return paddingClasses[props.padding]
})
</script>
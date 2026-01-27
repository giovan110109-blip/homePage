<template>
  <div :class="containerClasses">
    <div v-if="showLabel" class="flex justify-between items-center mb-2">
      <span class="text-sm font-medium text-gray-700">{{ label }}</span>
      <span class="text-sm text-gray-500">{{ displayValue }}{{ showPercentage ? '%' : '' }}</span>
    </div>
    
    <div :class="trackClasses">
      <div 
        :class="barClasses"
        :style="{ width: `${percentage}%` }"
        role="progressbar"
        :aria-valuenow="value"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-label="label"
      >

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { clsx } from 'clsx'

interface Props {
  value: number
  max?: number
  min?: number
  label?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showPercentage?: boolean
  animated?: boolean
  striped?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  min: 0,
  color: 'blue',
  size: 'md',
  showLabel: true,
  showPercentage: true,
  animated: false,
  striped: false
})

const percentage = computed(() => {
  const range = props.max - props.min
  const normalizedValue = Math.max(props.min, Math.min(props.max, props.value))
  return ((normalizedValue - props.min) / range) * 100
})

const displayValue = computed(() => {
  return props.showPercentage ? Math.round(percentage.value) : props.value
})

const containerClasses = computed(() => {
  return 'w-full'
})

const trackClasses = computed(() => {
  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden'
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  
  return clsx(baseClasses, sizeClasses[props.size])
})

const barClasses = computed(() => {
  const baseClasses = 'h-full relative'
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  }
  
  const stripedClasses = props.striped ? 'bg-gradient-to-r from-current to-current bg-[length:1rem_1rem] bg-repeat-x' : ''
  
  return clsx(
    baseClasses,
    colorClasses[props.color],
    stripedClasses
  )
})
</script>
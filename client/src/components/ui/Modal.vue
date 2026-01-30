<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-screen items-center justify-center p-4">
          <div 
            class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            @click="handleBackdropClick"
          ></div>
          
          <Transition
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div 
              v-if="modelValue"
              :class="modalClasses"
              role="dialog"
              aria-modal="true"
              :aria-labelledby="title ? 'modal-title' : undefined"
            >
              <div v-if="$slots.header || title || showClose" class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 v-if="title" id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ title }}
                  </h3>
                  <slot name="header" />
                </div>
                
                <button
                  v-if="showClose"
                  @click="close"
                  class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="关闭"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div :class="contentClasses">
                <slot />
              </div>
              
              <div v-if="$slots.footer" class="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { clsx } from 'clsx'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showClose: true,
  closeOnBackdrop: true,
  closeOnEscape: true
})

const emit = defineEmits<Emits>()

const modalClasses = computed(() => {
  const baseClasses = 'relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
  
  const sizeClasses = {
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full',
    xl: 'max-w-4xl w-full',
    full: 'max-w-7xl w-full mx-4'
  }
  
  return clsx(baseClasses, sizeClasses[props.size])
})

const contentClasses = computed(() => {
  return 'p-6'
})

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && props.modelValue) {
    close()
  }
}

onMounted(() => {
  if (props.closeOnEscape) {
    document.addEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  if (props.closeOnEscape) {
    document.removeEventListener('keydown', handleEscape)
  }
})
</script>
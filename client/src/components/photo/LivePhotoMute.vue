<script setup lang="ts">
import { Volume2, VolumeX } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isMuted = ref(props.modelValue)

const handleToggle = () => {
  isMuted.value = !isMuted.value
  emit('update:modelValue', isMuted.value)
}

watch(() => props.modelValue, (newVal) => {
  isMuted.value = newVal
})
</script>

<template>
  <button
    type="button"
    class="pointer-events-auto backdrop-blur-md bg-black/40 hover:bg-black/50 text-white rounded-full p-2 transition-all duration-200 select-none flex items-center justify-center"
    :class="isMuted ? 'text-gray-300' : 'text-white'"
    :title="isMuted ? '点击取消静音' : '点击静音'"
    @click.stop="handleToggle"
  >
    <Volume2 v-if="!isMuted" :size="20" class="transition-opacity duration-200" />
    <VolumeX v-else :size="20" class="transition-opacity duration-200" />
  </button>
</template>

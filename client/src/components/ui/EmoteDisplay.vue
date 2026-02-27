<template>
  <div
    class="emote-display"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <img
      v-if="emoteUrl"
      :src="emoteUrl"
      :alt="emote"
      :loading="lazy ? 'lazy' : 'eager'"
      class="emote-image"
      @error="onError"
    />
    <div v-else class="emote-placeholder">
      {{ emote }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEmotes } from '@/composables/useEmotes'

const props = withDefaults(defineProps<{
  emote: string
  size?: number
  lazy?: boolean
}>(), {
  size: 48,
  lazy: true
})

const { getEmoteUrl } = useEmotes()

const emoteUrl = computed(() => getEmoteUrl(props.emote))

const onError = (e: Event) => {
  console.warn(`表情包加载失败: ${props.emote}`)
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<style scoped>
.emote-display {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.emote-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

.emote-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px;
}
</style>

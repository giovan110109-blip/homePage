<template>
  <div class="emote-renderer" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEmotes } from '@/composables/useEmotes'

const props = withDefaults(defineProps<{
  text: string
  size?: number
}>(), {
  size: 48
})

const { getEmoteUrl } = useEmotes()

const renderedHtml = computed(() => {
  if (!props.text) return ''
  
  let html = props.text
  
  const emotePattern = /\{\{([^}]+)\}\}/g
  html = html.replace(emotePattern, (match, emoteName) => {
    const emoteUrl = getEmoteUrl(emoteName)
    if (emoteUrl) {
      return `<img src="${emoteUrl}" alt="${emoteName}" class="inline-emote" style="width: ${props.size}px; height: ${props.size}px; vertical-align: middle; display: inline-block; margin: 0 2px;" />`
    }
    return match
  })
  
  return html
})
</script>

<style scoped>
.emote-renderer {
  display: inline;
  word-wrap: break-word;
}

.emote-renderer :deep(.inline-emote) {
  display: inline-block;
  vertical-align: middle;
  margin: 0 2px;
  cursor: pointer;
  user-select: none;
}

.emote-renderer :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>

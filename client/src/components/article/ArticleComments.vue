<template>
  <div class="article-comments mt-12">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
      评论
    </h2>
    <CommentBox :target-id="articleId" @commented="onCommented" />
  </div>
</template>

<script setup lang="ts">
import CommentBox from '@/components/ui/CommentBox.vue'

interface Props {
  articleId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'commented'): void
}>()

const onCommented = () => {
  emit('commented')
}
</script>

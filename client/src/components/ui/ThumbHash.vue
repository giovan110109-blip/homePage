<script lang="ts" setup>
import { twMerge } from 'tailwind-merge'
import { thumbHashToDataURL } from 'thumbhash'

const props = defineProps<{
  thumbhash: ArrayLike<number> | string
  class?: string
}>()

const dataUrl = computed(() => {
  if (typeof props.thumbhash === 'string') {
        const binaryString = atob(props.thumbhash);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return thumbHashToDataURL(bytes)
  }

  return thumbHashToDataURL(props.thumbhash)
})
</script>

<template>
  <img
    :src="dataUrl"
    :class="twMerge('w-full h-full', props.class)"
       :style="{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
        filter: 'blur(12px)',
        zIndex: 1,
      }"
  />
</template>

<style scoped></style>

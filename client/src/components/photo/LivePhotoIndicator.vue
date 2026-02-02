<script lang="ts" setup>
import { motion } from "motion-v";

defineProps<{
  photo: any;
  isVideoPlaying: boolean;
  processingState?: {
    isProcessing: boolean;
    progress: number;
  } | null;
}>();
</script>

<template>
  <motion.div
    v-if="photo.isLive"
    class="backdrop-blur-md rounded-full pl-1 pr-1.5 py-1 text-[13px] font-bold flex items-center gap-0.5 leading-0 select-none transition-colors duration-300"
    :class="`${isVideoPlaying ? 'text-yellow-300 bg-yellow-300/10' : 'text-white bg-black/30'}`"
    :animate="{
      scale: isVideoPlaying ? 1.06 : 1,
    }"
    :transition="{
      duration: 0.3,
      ease: 'easeInOut',
    }"
  >
    <svg
      v-if="processingState?.isProcessing"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon icon-tabler icons-tabler-outline icon-tabler-live-photo livephoto-spin transition-transform duration-300"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" />
      <path d="M15.9 20.11l0 .01" />
      <path d="M19.04 17.61l0 .01" />
      <path d="M20.77 14l0 .01" />
      <path d="M20.77 10l0 .01" />
      <path d="M19.04 6.39l0 .01" />
      <path d="M15.9 3.89l0 .01" />
      <path d="M12 3l0 .01" />
      <path d="M8.1 3.89l0 .01" />
      <path d="M4.96 6.39l0 .01" />
      <path d="M3.23 10l0 .01" />
      <path d="M3.23 14l0 .01" />
      <path d="M4.96 17.61l0 .01" />
      <path d="M8.1 20.11l0 .01" />
      <path d="M12 21l0 .01" />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon icon-tabler icons-tabler-outline icon-tabler-live-photo transition-transform duration-300"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" />
      <path d="M15.9 20.11l0 .01" />
      <path d="M19.04 17.61l0 .01" />
      <path d="M20.77 14l0 .01" />
      <path d="M20.77 10l0 .01" />
      <path d="M19.04 6.39l0 .01" />
      <path d="M15.9 3.89l0 .01" />
      <path d="M12 3l0 .01" />
      <path d="M8.1 3.89l0 .01" />
      <path d="M4.96 6.39l0 .01" />
      <path d="M3.23 10l0 .01" />
      <path d="M3.23 14l0 .01" />
      <path d="M4.96 17.61l0 .01" />
      <path d="M8.1 20.11l0 .01" />
      <path d="M12 21l0 .01" />
    </svg>
    <span>实况</span>

    <span
      v-if="processingState?.isProcessing"
      class="text-[12px] text-white/80 pl-1"
    >
      {{ Math.round(processingState.progress || 0) }}%
    </span>
  </motion.div>
</template>

<style scoped>
@keyframes livephoto-spin {
  to {
    transform: rotate(360deg) scale(var(--livephoto-scale, 1));
  }
}

.livephoto-spin {
  animation: livephoto-spin 1s linear infinite;
  transform-origin: center;
}

.livephoto-scale {
  transform: scale(var(--livephoto-scale, 1));
  transform-origin: center;
}
</style>

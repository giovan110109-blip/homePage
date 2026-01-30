<template>
  <div
    ref="cardRef"
    class="relative bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-300/40 dark:border-white/20 rounded-2xl p-6 hover:bg-white/70 dark:hover:bg-white/15 hover:border-gray-400/50 dark:hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
    @click="handleClick"
    :style="{
      transform: tiltEnabled && !isMobile ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)` : 'none',
      '--glow-x': glowPosition.x + '%',
      '--glow-y': glowPosition.y + '%',
      '--glow-intensity': glowIntensity,
      '--glow-radius': spotlightRadius + 'px'
    }"
  >
    <!-- Border Glow Effect -->
    <div
      v-if="enableBorderGlow && !disableAnimations && !isMobile"
      class="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none"
      :class="{ 'opacity-100': isHovered }"
      :style="{
        background: `radial-gradient(${spotlightRadius}px circle at var(--glow-x) var(--glow-y), rgba(${glowColor}, 0.8), rgba(${glowColor}, 0.4) 40%, transparent 70%)`
      }"
    ></div>

    <!-- Spotlight Effect -->
    <div
      v-if="enableSpotlight && !disableAnimations && !isMobile"
      class="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none"
      :class="{ 'opacity-100': isHovered }"
      :style="{
        background: `radial-gradient(${spotlightRadius}px circle at var(--glow-x) var(--glow-y), rgba(255, 255, 255, 0.1), transparent 50%)`
      }"
    ></div>

    <!-- Click Ripple Effect -->
    <div
      v-if="clickEffect && ripple.show"
      class="absolute rounded-full bg-white/30 pointer-events-none"
      :style="{
        left: ripple.x - 20 + 'px',
        top: ripple.y - 20 + 'px',
        width: '40px',
        height: '40px'
      }"
    ></div>

    <!-- Project Image -->
    <div class="relative z-10 mb-3">
      <img
        v-if="project.image"
        :src="project.image"
        :alt="project.title"
        class="w-full h-32 object-cover rounded border border-gray-100 dark:border-gray-700"
      />
    </div>

    <!-- Project Content -->
    <h4 class="relative z-10 text-base font-medium text-gray-900 dark:text-white mb-2 drop-shadow-md">
      {{ project.title }}
    </h4>
    <p class="relative z-10 text-gray-700 dark:text-gray-200 text-sm mb-3 drop-shadow-sm">
      {{ project.description }}
    </p>
    
    <!-- Tech Stack -->
    <div class="relative z-10 flex flex-wrap gap-1 mb-3">
      <span
        v-for="tech in project.technologies.slice(0, 3)"
        :key="tech"
        class="px-2 py-1 text-xs bg-gray-200/60 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 rounded backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30"
      >
        {{ tech }}
      </span>
      <span
        v-if="project.technologies.length > 3"
        class="px-2 py-1 text-xs bg-gray-200/60 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 rounded backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30"
      >
        +{{ project.technologies.length - 3 }}
      </span>
    </div>
    
    <!-- Date -->
    <div class="relative z-10 text-xs text-gray-600 dark:text-gray-400 mb-3 drop-shadow-sm">
      {{ formatDate(project.createdAt) }}
    </div>
    
    <!-- Links -->
    <div class="relative z-10 flex gap-3 text-sm">
      <a
        v-if="project.demoUrl"
        :href="project.demoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 font-medium drop-shadow-sm"
      >
        演示
      </a>
      <a
        v-if="project.githubUrl"
        :href="project.githubUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium drop-shadow-sm"
      >
        代码
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

interface Project {
  id: string
  title: string
  description: string
  image?: string
  technologies: string[]
  createdAt: string
  demoUrl?: string
  githubUrl?: string
}

interface Props {
  project: Project
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  enableTilt?: boolean
  enableMagnetism?: boolean
  clickEffect?: boolean
  spotlightRadius?: number
  particleCount?: number
  glowColor?: string
  disableAnimations?: boolean
}

const props = withDefaults(defineProps<{
  project: Project
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  enableTilt?: boolean
  enableMagnetism?: boolean
  clickEffect?: boolean
  rippleOnClick?: boolean
  glowColor?: string
  borderGlowOpacity?: number
  spotlightRadius?: number
  particleCount?: number
  disableAnimations?: boolean
}>(), {
  enableStars: true,
  enableSpotlight: true,
  enableBorderGlow: true,
  enableTilt: false,
  enableMagnetism: false,
  clickEffect: true,
  rippleOnClick: true,
  glowColor: '132, 0, 255',
  borderGlowOpacity: 0.5,
  spotlightRadius: 300,
  particleCount: 12,
  disableAnimations: false
})

const cardRef = ref<HTMLElement>()
const isHovered = ref(false)
const isMobile = ref(false)

const glowPosition = reactive({ x: 50, y: 50 })
const glowIntensity = ref(0)
const tilt = reactive({ x: 0, y: 0 })
const ripple = reactive({ show: false, x: 0, y: 0 })

const tiltEnabled = computed(() => props.enableTilt && !props.disableAnimations && !isMobile.value)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleMouseEnter = () => {
  if (props.disableAnimations || isMobile.value) return
  isHovered.value = true
  glowIntensity.value = 1
}

const handleMouseLeave = () => {
  if (props.disableAnimations || isMobile.value) return
  isHovered.value = false
  glowIntensity.value = 0
  
  if (tiltEnabled.value) {
    gsap.to(tilt, {
      x: 0,
      y: 0,
      duration: 0.3,
      ease: 'power2.out'
    })
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (props.disableAnimations || isMobile.value || !cardRef.value) return
  
  const rect = cardRef.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  
  glowPosition.x = x
  glowPosition.y = y
  
  if (tiltEnabled.value) {
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    const rotateX = ((mouseY - centerY) / centerY) * -10
    const rotateY = ((mouseX - centerX) / centerX) * 10
    
    gsap.to(tilt, {
      x: rotateX,
      y: rotateY,
      duration: 0.2,
      ease: 'power2.out'
    })
  }
}

const handleClick = (event: MouseEvent) => {
  if (!props.clickEffect || props.disableAnimations || isMobile.value || !cardRef.value) return
  
  const rect = cardRef.value.getBoundingClientRect()
  ripple.x = event.clientX - rect.left
  ripple.y = event.clientY - rect.top
  ripple.show = true
  
  setTimeout(() => {
    ripple.show = false
  }, 600)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  })
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
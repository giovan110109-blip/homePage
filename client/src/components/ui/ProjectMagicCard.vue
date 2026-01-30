<template>
  <div
    ref="cardRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    class="relative bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-300/40 dark:border-white/20 rounded-2xl overflow-hidden hover:bg-white/70 dark:hover:bg-white/15 hover:border-gray-400/50 dark:hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer"
    :style="{
      '--glow-x': glowX,
      '--glow-y': glowY,
      '--glow-intensity': glowIntensity,
      '--glow-radius': `${spotlightRadius}px`
    }"
  >
    <!-- Border Glow Effect -->
    <div
      v-if="enableBorderGlow && !disableAnimations"
      class="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none"
      :class="{ 'opacity-100': isHovered }"
      :style="{
        background: `radial-gradient(${spotlightRadius}px circle at var(--glow-x) var(--glow-y), rgba(${glowColor}, 0.4), transparent 70%)`,
        filter: 'blur(2px)'
      }"
    ></div>

    <!-- Spotlight Effect -->
    <div
      v-if="enableSpotlight && !disableAnimations"
      class="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
      :class="{ 'opacity-100': isHovered }"
      :style="{
        background: `radial-gradient(${spotlightRadius}px circle at var(--glow-x) var(--glow-y), rgba(${glowColor}, 0.15), transparent 70%)`
      }"
    ></div>

    <!-- Particles Container -->
    <div
      v-if="enableStars && !disableAnimations"
      ref="particleContainer"
      class="absolute inset-0 pointer-events-none overflow-hidden"
    ></div>

    <!-- Card Content -->
    <div class="relative z-10">
      <slot />
    </div>

    <!-- Click Ripple Effect -->
    <div
      v-if="clickEffect && ripples.length > 0"
      class="absolute inset-0 pointer-events-none"
    >
      <div
        v-for="ripple in ripples"
        :key="ripple.id"
        class="absolute rounded-full border-2 opacity-75"
        :style="{
          left: ripple.x + 'px',
          top: ripple.y + 'px',
          width: ripple.size + 'px',
          height: ripple.size + 'px',
          borderColor: `rgba(${glowColor}, 0.6)`,
          transform: 'translate(-50%, -50%)'
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { computed, nextTick, onMounted, onUnmounted, ref, reactive } from 'vue'

interface Particle {
  element: HTMLElement
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

interface Props {
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  disableAnimations?: boolean
  spotlightRadius?: number
  particleCount?: number
  enableTilt?: boolean
  glowColor?: string
  clickEffect?: boolean
  enableMagnetism?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableStars: true,
  enableSpotlight: true,
  enableBorderGlow: true,
  enableTilt: false,
  enableMagnetism: false,
  clickEffect: true,
  spotlightRadius: 250,
  particleCount: 6,
  glowColor: '132, 0, 255'
})

const cardRef = ref<HTMLElement>()
const particleContainer = ref<HTMLElement>()
const isHovered = ref(false)
const glowX = ref('50%')
const glowY = ref('50%')
const glowIntensity = ref(0)
const particles = ref<Particle[]>([])
const ripples = ref<Ripple[]>([])
const animationFrameId = ref<number | null>(null)
const rippleCounter = ref(0)

const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
})

const shouldDisableAnimations = computed(() => {
  return props.disableAnimations || isMobile.value
})

const createParticle = (x: number, y: number): Particle => {
  const element = document.createElement('div')
  element.className = 'particle'
  element.style.cssText = `
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(${props.glowColor}, 1);
    box-shadow: 0 0 4px rgba(${props.glowColor}, 0.6);
    pointer-events: none;
    z-index: 100;
  `
  
  if (particleContainer.value) {
    particleContainer.value.appendChild(element)
  }
  
  return {
    element,
    x,
    y,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    life: 0,
    maxLife: 40 + Math.random() * 40
  }
}

const updateParticles = () => {
  if (!isHovered.value) return

  particles.value.forEach((particle, index) => {
    particle.life++
    particle.x += particle.vx
    particle.y += particle.vy
    
    const opacity = 1 - (particle.life / particle.maxLife)
    particle.element.style.left = particle.x + 'px'
    particle.element.style.top = particle.y + 'px'
    particle.element.style.opacity = opacity.toString()
    
    if (particle.life >= particle.maxLife) {
      particle.element.remove()
      particles.value.splice(index, 1)
    }
  })
}

const animateParticles = () => {
  updateParticles()
  animationFrameId.value = requestAnimationFrame(animateParticles)
}

const handleMouseMove = (event: MouseEvent) => {
  const card = cardRef.value
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const relativeX = (x / rect.width) * 100
  const relativeY = (y / rect.height) * 100

  isHovered.value = true
  glowX.value = `${relativeX}%`
  glowY.value = `${relativeY}%`
  glowIntensity.value = 1

  // Tilt effect
  if (props.enableTilt && !shouldDisableAnimations.value) {
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / centerY * -8
    const rotateY = (x - centerX) / centerX * 8
    
    gsap.to(card, {
      rotationX: rotateX,
      rotationY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: 'power2.out'
    })
  }

  // Magnetism effect
  if (props.enableMagnetism && !shouldDisableAnimations.value) {
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const deltaX = (x - centerX) * 0.05
    const deltaY = (y - centerY) * 0.05
    
    gsap.to(card, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: 'power2.out'
    })
  }

  // Create particles
  if (props.enableStars && !shouldDisableAnimations.value && Math.random() < 0.2) {
    if (particles.value.length < props.particleCount) {
      const particle = createParticle(x, y)
      particles.value.push(particle)
    }
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
  glowIntensity.value = 0

  const card = cardRef.value
  if (card) {
    // Reset tilt and magnetism
    gsap.to(card, {
      rotationX: 0,
      rotationY: 0,
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    })
  }

  // Clear particles
  particles.value.forEach(particle => {
    gsap.to(particle.element, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'back.in(1.7)',
      onComplete: () => {
        particle.element.remove()
      }
    })
  })
  particles.value = []
}

const handleClick = (event: MouseEvent) => {
  if (!props.clickEffect || shouldDisableAnimations.value) return

  const card = cardRef.value
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const rippleId = rippleCounter.value++
  const ripple: Ripple = {
    id: rippleId,
    x,
    y,
    size: 0
  }

  ripples.value.push(ripple)

  // Animate ripple
  gsap.to(ripple, {
    size: 150,
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => {
      const index = ripples.value.findIndex(r => r.id === rippleId)
      if (index > -1) {
        ripples.value.splice(index, 1)
      }
    }
  })
}

onMounted(() => {
  if (!shouldDisableAnimations.value) {
    animateParticles()
  }
})

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
  
  // Clean up particles
  particles.value.forEach(particle => {
    particle.element.remove()
  })
})
</script>

<style scoped>
.particle {
  will-change: transform, opacity;
}

@media (max-width: 768px) {
  .magic-bento-card {
    transform: none !important;
  }
}
</style>
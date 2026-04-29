<template>
  <div class="theme-page min-h-screen flex flex-col relative overflow-hidden">
    <!-- 背景装饰元素 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl bg-[rgba(120,174,205,0.18)] dark:bg-[rgba(159,202,228,0.16)]"></div>
      <div class="absolute top-1/3 -left-20 w-60 h-60 rounded-full blur-3xl bg-[rgba(168,217,241,0.16)] dark:bg-[rgba(120,174,205,0.15)]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-3xl bg-[rgba(145,196,226,0.12)] dark:bg-[rgba(197,225,241,0.12)]"></div>
      <div class="absolute bottom-0 left-1/3 w-72 h-72 rounded-full blur-3xl bg-[rgba(223,240,250,0.18)] dark:bg-[rgba(53,88,118,0.22)]"></div>
    </div>
    
    <Header v-if="showLayoutChrome" />

    <!-- 全局鼠标光晕（与 /portfolio 卡片风格协调） -->
    <div
      v-if="showHalo"
      class="global-mouse-halo fixed inset-0 pointer-events-none hidden md:block z-30 mix-blend-screen"
      :style="{ '--hx': haloX + 'px', '--hy': haloY + 'px' }"
    >
      <!-- 暖色边界光晕，和全局新主题保持一致 -->
      <div
        class="absolute inset-0"
        :style="{
          background: `radial-gradient(${haloRadius}px circle at var(--hx) var(--hy), rgba(${haloColor}, 0.18), rgba(${haloColor}, 0.08) 45%, transparent 75%)`,
          filter: 'blur(2px)',
          transition: 'opacity 120ms ease-out'
        }"
      ></div>
      <!-- 细腻的白色聚光层，提升层次 -->
      <div
        class="absolute inset-0"
        :style="{
          background: `radial-gradient(${spotlightRadius}px circle at var(--hx) var(--hy), rgba(255,255,255,0.08), transparent 60%)`,
          transition: 'opacity 120ms ease-out'
        }"
      ></div>
    </div>
    
    <main :class="['flex-1', 'relative', 'z-10', showLayoutChrome?'pt-16':'']">
    <RouterView v-slot="{ Component, route: currentRoute }">
      <AppTransition 
        :name="transitionName" 
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <KeepAlive :include="cachedViewNames" :max="3">
          <component :is="Component" :key="currentRoute.path" />
        </KeepAlive>
      </AppTransition>
    </RouterView>
    </main>
    
    <Footer v-if="showLayoutChrome" />
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppTransition from '@/components/ui/AppTransition'
import BackToTop from '@/components/ui/BackToTop.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'

const route = useRoute()
const transitionName = ref('page-soft')
const cachedViewNames = ['AboutView']
const showLayoutChrome = computed(() => !route.path.startsWith('/map'))

const onBeforeEnter = (el: Element) => {
  ;(el as HTMLElement).style.transformOrigin = 'center center'
}

const onEnter = (_el: Element, done: () => void) => {
  setTimeout(done, 260)
}

const onLeave = (_el: Element, done: () => void) => {
  setTimeout(done, 180)
}

// ===== 全局鼠标光晕逻辑（与 Portfolio 卡片鼠标光晕风格协调） =====
const showHalo = ref(false)
const haloX = ref(0)
const haloY = ref(0)
const haloColor = '120, 174, 205'
const haloRadius = 300
const spotlightRadius = 220

let targetX = 0
let targetY = 0
let rafId: number | null = null

const isCoarsePointer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches
if (isCoarsePointer) {
  showHalo.value = false
}

const animate = () => {
  // 简单插值，避免抖动
  haloX.value += (targetX - haloX.value) * 0.18
  haloY.value += (targetY - haloY.value) * 0.18
  rafId = requestAnimationFrame(animate)
}

const handleMouseMove = (e: MouseEvent) => {
  targetX = e.clientX
  targetY = e.clientY
  if (!rafId) rafId = requestAnimationFrame(animate)
}

const handleMouseLeaveWindow = () => {
  // 悬停离开时逐渐淡出
  // 这里不隐藏容器，仅将目标位置缓慢移向屏幕中心，保持柔和
  targetX = window.innerWidth / 2
  targetY = window.innerHeight / 2
}

onMounted(() => {
  if (!showHalo.value) return
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  window.addEventListener('mouseleave', handleMouseLeaveWindow, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeaveWindow)
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
})
</script>

<style scoped>
.page-soft-enter-active {
  transition:
    opacity 260ms ease,
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: opacity, transform;
}

.page-soft-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
  will-change: opacity, transform;
}

.page-soft-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.page-soft-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.page-soft-enter-to,
.page-soft-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .page-soft-enter-active,
  .page-soft-leave-active {
    transition: none;
  }
}
</style>

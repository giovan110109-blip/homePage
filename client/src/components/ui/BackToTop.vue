<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const scrollTop = ref(0)
const visibleThreshold = 320

const isVisible = computed(() => scrollTop.value > visibleThreshold)

const updateScrollTop = () => {
  scrollTop.value = window.scrollY || document.documentElement.scrollTop || 0
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  updateScrollTop()
  window.addEventListener('scroll', updateScrollTop, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollTop)
})
</script>

<template>
  <Transition name="back-to-top">
    <button
      v-if="isVisible"
      class="back-to-top theme-panel-soft"
      type="button"
      aria-label="回到顶部"
      title="回到顶部"
      @click="scrollToTop"
    >
      <span class="back-to-top__glow"></span>
      <span class="back-to-top__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 19V5M12 5L6.75 10.25M12 5l5.25 5.25"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="back-to-top__text">TOP</span>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 1.5rem;
  bottom: 1.75rem;
  z-index: 45;
  display: inline-flex;
  align-items: center;
  gap: 0.72rem;
  min-width: 3.7rem;
  padding: 0.78rem 0.95rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--theme-accent) 18%, var(--theme-border));
  color: var(--theme-text-primary);
  overflow: hidden;
  cursor: pointer;
  backdrop-filter: blur(20px);
  box-shadow:
    0 16px 40px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.38);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease,
    background-color 220ms ease;
}

.back-to-top::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.26), transparent 42%),
    linear-gradient(180deg, var(--theme-accent-soft), transparent 120%);
  opacity: 0.95;
  pointer-events: none;
}

.back-to-top:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border));
  box-shadow:
    0 22px 48px rgba(15, 23, 42, 0.22),
    0 0 0 6px color-mix(in srgb, var(--theme-accent) 12%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);
}

.back-to-top:active {
  transform: translateY(-1px) scale(0.98);
}

.back-to-top:focus-visible {
  outline: none;
  box-shadow:
    0 22px 48px rgba(15, 23, 42, 0.2),
    0 0 0 3px color-mix(in srgb, var(--theme-accent) 45%, transparent),
    0 0 0 8px color-mix(in srgb, var(--theme-accent) 16%, transparent);
}

.back-to-top__glow {
  position: absolute;
  inset: auto auto -1.2rem -0.6rem;
  width: 4rem;
  height: 4rem;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--theme-accent) 48%, white) 0%, transparent 72%);
  opacity: 0.55;
  pointer-events: none;
}

.back-to-top__icon,
.back-to-top__text {
  position: relative;
  z-index: 1;
}

.back-to-top__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-bg-elevated) 74%, transparent);
  color: var(--theme-accent-strong);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.back-to-top__icon svg {
  width: 1rem;
  height: 1rem;
}

.back-to-top__text {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--theme-text-secondary);
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.9);
}

@media (max-width: 768px) {
  .back-to-top {
    right: 1rem;
    bottom: 1.2rem;
    padding: 0.72rem;
    min-width: auto;
  }

  .back-to-top__text {
    display: none;
  }
}
</style>

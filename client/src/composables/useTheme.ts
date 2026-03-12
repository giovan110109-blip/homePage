import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue'

type Theme = 'light' | 'dark'

const getPreferredTheme = (): Theme => {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'light' || saved === 'dark') {
    return saved
  }
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let transitionTimer: ReturnType<typeof setTimeout> | null = null

const applyTheme = (t: Theme, transition = false) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    
    if (transitionTimer) {
      clearTimeout(transitionTimer)
      transitionTimer = null
    }
    
    if (transition && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        root.classList.remove('light', 'dark')
        root.classList.add(t)
        root.style.colorScheme = t
      })
    } else {
      root.classList.add('theme-transition')
      root.classList.remove('light', 'dark')
      root.classList.add(t)
      root.style.colorScheme = t
      
      transitionTimer = setTimeout(() => {
        root.classList.remove('theme-transition')
        transitionTimer = null
      }, 300)
    }
  }
}

const globalTheme = ref<Theme>(getPreferredTheme())
let isUserSet = false
let initialized = false
let mediaQueryHandler: (() => void) | null = null

applyTheme(globalTheme.value)

export function useTheme() {
  onMounted(() => {
    if (!initialized) {
      if (isUserSet) {
        localStorage.setItem('theme', globalTheme.value)
      }
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQueryHandler = () => {
        if (!isUserSet) {
          globalTheme.value = mediaQuery.matches ? 'dark' : 'light'
        }
      }
      mediaQuery.addEventListener('change', mediaQueryHandler)
      
      initialized = true
    }
  })

  watchEffect(() => {
    applyTheme(globalTheme.value)
    if (isUserSet) {
      localStorage.setItem('theme', globalTheme.value)
    }
  })

  const toggleTheme = () => {
    isUserSet = true
    const newTheme = globalTheme.value === 'light' ? 'dark' : 'light'
    applyTheme(newTheme, true)
    globalTheme.value = newTheme
  }

  onUnmounted(() => {
    if (transitionTimer) {
      clearTimeout(transitionTimer)
      transitionTimer = null
    }
    if (mediaQueryHandler) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.removeEventListener('change', mediaQueryHandler)
      mediaQueryHandler = null
    }
  })

  return {
    theme: globalTheme,
    toggleTheme,
    isDark: computed(() => globalTheme.value === 'dark'),
  }
}

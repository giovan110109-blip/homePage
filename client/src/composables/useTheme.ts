import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue'

type Theme = 'light' | 'dark'

const getSavedTheme = (): Theme | null => {
  if (typeof localStorage === 'undefined') return null

  const saved = localStorage.getItem('theme') as Theme | null
  return saved === 'light' || saved === 'dark' ? saved : null
}

const getPreferredTheme = (): Theme => {
  const saved = getSavedTheme()
  if (saved) {
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
let isUserSet = getSavedTheme() !== null
let activeThemeConsumers = 0
let mediaQuery: MediaQueryList | null = null
let mediaQueryHandler: ((event: MediaQueryListEvent) => void) | null = null

const stopTransitionTimer = () => {
  if (!transitionTimer) return

  clearTimeout(transitionTimer)
  transitionTimer = null
  document.documentElement.classList.remove('theme-transition')
}

const startSystemThemeListener = () => {
  if (typeof window === 'undefined' || mediaQueryHandler) return

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQueryHandler = () => {
    if (!isUserSet && mediaQuery) {
      globalTheme.value = mediaQuery.matches ? 'dark' : 'light'
    }
  }
  mediaQuery.addEventListener('change', mediaQueryHandler)
}

const stopSystemThemeListener = () => {
  if (!mediaQuery || !mediaQueryHandler) return

  mediaQuery.removeEventListener('change', mediaQueryHandler)
  mediaQuery = null
  mediaQueryHandler = null
}

applyTheme(globalTheme.value)

export function useTheme() {
  onMounted(() => {
    activeThemeConsumers += 1

    if (isUserSet) {
      localStorage.setItem('theme', globalTheme.value)
    }
    startSystemThemeListener()
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
    activeThemeConsumers = Math.max(0, activeThemeConsumers - 1)
    if (activeThemeConsumers > 0) {
      return
    }

    stopSystemThemeListener()
    if (typeof document !== 'undefined') {
      stopTransitionTimer()
    }
  })

  return {
    theme: globalTheme,
    toggleTheme,
    isDark: computed(() => globalTheme.value === 'dark'),
  }
}

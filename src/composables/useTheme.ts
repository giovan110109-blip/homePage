import { ref, watchEffect, onMounted, computed } from 'vue'

type Theme = 'light' | 'dark'

export function useTheme() {
  const theme = ref<Theme>('light')
  const isUserSet = ref(false)

  const getPreferredTheme = (): Theme => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      isUserSet.value = true
      return saved
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const applyTheme = (t: Theme, saveToStorage = true) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    if (saveToStorage && isUserSet.value) {
      localStorage.setItem('theme', t)
    } else if (!isUserSet.value) {
      // 如果用户没有手动设置，不保存到localStorage，跟随浏览器
      localStorage.removeItem('theme')
    }
  }

  const toggleTheme = () => {
    isUserSet.value = true
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  onMounted(() => {
    theme.value = getPreferredTheme()
    applyTheme(theme.value, false)
    
    // 监听浏览器主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (!isUserSet.value) {
        theme.value = mediaQuery.matches ? 'dark' : 'light'
      }
    }
    mediaQuery.addEventListener('change', handleChange)
  })

  watchEffect(() => {
    applyTheme(theme.value, isUserSet.value)
  })

  return {
    theme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark'),
  }
}
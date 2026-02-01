
type Theme = 'light' | 'dark'

// 全局单例状态 - 在模块加载时初始化，只初始化一次
const getPreferredTheme = (): Theme => {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'light' || saved === 'dark') {
    return saved
  }
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (t: Theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    document.documentElement.style.colorScheme = t
  }
}

const globalTheme = ref<Theme>(getPreferredTheme())
let isUserSet = false
let initialized = false

// 页面加载时立即应用主题
applyTheme(globalTheme.value)

export function useTheme() {
  onMounted(() => {
    if (!initialized) {
      // 保存用户设置到localStorage
      if (isUserSet) {
        localStorage.setItem('theme', globalTheme.value)
      }
      
      // 监听浏览器主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (!isUserSet) {
          globalTheme.value = mediaQuery.matches ? 'dark' : 'light'
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      
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
    globalTheme.value = globalTheme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme: globalTheme,
    toggleTheme,
    isDark: computed(() => globalTheme.value === 'dark'),
  }
}
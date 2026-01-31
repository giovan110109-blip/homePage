import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.scss'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus' // 引入Element Plus核心库
import 'element-plus/dist/index.css' // 引入Element Plus样式
import 'element-plus/theme-chalk/dark/css-vars.css' // 引入 Element Plus 暗黑模式变量
import 'element-plus/theme-chalk/display.css'
import 'maplibre-gl/dist/maplibre-gl.css' // 引入MapLibre GL样式
import { useSiteInfoStore } from './stores/siteInfo'

import { initImageCacheDiagnostics } from './utils/image-cache-diagnostics'

const { VITE_SITE_TITLE } = import.meta.env

// 创建Vue应用实例
const app = createApp(App)

// 创建Pinia实例
const pinia = createPinia()

// 使用插件
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(ElementPlus)

if (VITE_SITE_TITLE) {
  document.title = VITE_SITE_TITLE
}

// 初始化图片缓存诊断工具
initImageCacheDiagnostics()

// 处理404页面重定向，并在路由就绪后再挂载应用，避免刷新闪烁
router.isReady().then(() => {
  // 初始化加载网站信息（全局只需要一次）
  const siteInfoStore = useSiteInfoStore()
  siteInfoStore.fetchSiteInfo()
  
  const redirectPath = sessionStorage.getItem('redirectPath')
  if (redirectPath) {
    sessionStorage.removeItem('redirectPath')
    router.push(redirectPath)
  }
  app.mount('#app')
})

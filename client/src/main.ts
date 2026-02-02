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

const { VITE_SITE_TITLE, VITE_SITE_DESCRIPTION } = import.meta.env

if (import.meta.env.PROD) {
  console.clear()
  const noop = () => {}
  console.log = noop
  console.info = noop
  console.warn = noop
  console.error = noop
  console.debug = noop
}

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

if (VITE_SITE_DESCRIPTION) {
  let metaDescription = document.querySelector('meta[name="description"]')
  if (!metaDescription) {
    metaDescription = document.createElement('meta')
    metaDescription.setAttribute('name', 'description')
    document.head.appendChild(metaDescription)
  }
  metaDescription.setAttribute('content', VITE_SITE_DESCRIPTION)
}

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

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.scss'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus' // 引入Element Plus核心库
import 'element-plus/dist/index.css' // 引入Element Plus样式
import 'element-plus/theme-chalk/dark/css-vars.css' // 引入 Element Plus 暗黑模式变量

const { VITE_SITE_TITLE } = import.meta.env

// 创建Vue应用实例
const app = createApp(App)

// 创建Pinia实例
const pinia = createPinia()

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

if (VITE_SITE_TITLE) {
  document.title = VITE_SITE_TITLE
}

// 处理404页面重定向
router.isReady().then(() => {
  const redirectPath = sessionStorage.getItem('redirectPath')
  if (redirectPath) {
    sessionStorage.removeItem('redirectPath')
    router.push(redirectPath)
  }
})

// 挂载应用
app.mount('#app')

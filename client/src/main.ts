import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.scss'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/theme-chalk/display.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import 'highlight.js/styles/github.css'
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

const app = createApp(App)

const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

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

router.isReady().then(() => {
  const siteInfoStore = useSiteInfoStore()
  siteInfoStore.fetchSiteInfo()
  
  const redirectPath = sessionStorage.getItem('redirectPath')
  if (redirectPath) {
    sessionStorage.removeItem('redirectPath')
    router.push(redirectPath)
  }
  app.mount('#app')
})

/**
 * HTTP Utilities
 * Contains HTTP client setup and interceptor configuration
 */

import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const { VITE_API_BASE_URL, VITE_API_BASE_URL_LOCAL } = import.meta.env
const RAW_BASE_URL = import.meta.env.DEV
  ? (VITE_API_BASE_URL_LOCAL || VITE_API_BASE_URL)
  : VITE_API_BASE_URL


// 默认 /api。若提供 base url 且未带 /api，自动补全，避免打到根路径导致 404
const BASE_URL = (() => {
  if (!RAW_BASE_URL) return '/api'
  const trimmed = RAW_BASE_URL.replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
})()

/**
 * Create and configure the HTTP client with interceptors
 */
export function createHttpClient(): AxiosInstance {
  const service: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    // 默认不带凭证，避免 CORS 需要指定 allow-credentials
    withCredentials: false,
  })

  // 请求拦截器
  service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 可在此处添加 token 等通用 header
      // const token = localStorage.getItem('token')
      // if (token) config.headers.Authorization = `Bearer ${token}`
      if (!config.headers) {
        config.headers = new AxiosHeaders()
      }
      config.headers['x-request-timestamp'] = Date.now().toString()

      const url = config.url || ''
      if (url.startsWith('/admin')) {
        const authStore = useAuthStore()
        if (authStore.token) {
          config.headers.Authorization = `Bearer ${authStore.token}`
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // 响应拦截器
  service.interceptors.response.use(
    (response: AxiosResponse) => {
      // 统一处理响应数据
      return response.data
    },
    (error) => {
      // 统一处理错误
      // 可根据 error.response.status 做全局错误提示
      const status = error?.response?.status
      const url = error?.config?.url || ''
      if (status === 401 && url.startsWith('/admin') && url !== '/admin/login') {
        const authStore = useAuthStore()
        authStore.logout()
        router.replace({ name: 'admin-login', query: { redirect: '/admin' } })
      }
      return Promise.reject(error)
    }
  )

  return service
}

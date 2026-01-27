import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

const { VITE_API_BASE_URL } = import.meta.env
// 默认 /api，便于本地代理；生产可在 .env 中覆盖
const BASE_URL = VITE_API_BASE_URL || '/api'

const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可在此处添加 token 等通用 header
    // const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
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
    return Promise.reject(error)
  }
)


// 示例：src/api/user.ts
// import request from './request'

// // GET 请求
// export function getUserInfo(userId: string) {
//   return request.get(`/user/${userId}`)
// }

// // POST 请求
// export function login(data: { username: string; password: string }) {
//   return request.post('/login', data)
// }

export default service

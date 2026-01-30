import { createHttpClient } from '@/utils/http'

const service = createHttpClient()

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

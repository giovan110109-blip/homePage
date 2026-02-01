import { defineStore } from 'pinia'
import request from '@/api/request'
import { verifyToken as verifyTokenApi } from '@/api/auth'

interface AdminUser {
  username: string
  nickname?: string
  avatar?: string
  email?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as AdminUser | null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    async login(username: string, password: string) {
      const res = await request.post('/admin/login', { username, password })
      const data = res?.data || res
      this.token = data?.token || ''
      this.user = data?.user || null
      return data
    },

    logout() {
      this.token = ''
      this.user = null
    },

    async verifyToken() {
      try {
        const data = await verifyTokenApi()
        if (data.valid) {
          // token 有效，更新用户信息
          if (data.user) {
            this.user = data.user
          }
          return true
        } else {
          // token 无效
          this.logout()
          return false
        }
      } catch (error) {
        // 请求失败，token 可能过期
        this.logout()
        return false
      }
    }
  },

  persist: {
    key: 'admin-auth',
    paths: ['token', 'user'],
  },
})
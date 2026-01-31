import { defineStore } from 'pinia'
import request from '@/api/request'

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
  },

  persist: {
    key: 'admin-auth',
    paths: ['token', 'user'],
  },
})
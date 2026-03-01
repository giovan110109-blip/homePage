import { defineStore } from 'pinia'
import request from '@/api/request'
import { verifyToken as verifyTokenApi } from '@/api/auth'

interface AdminUser {
  _id?: string
  username?: string
  nickname?: string
  avatar?: string
  email?: string
  roleIds?: string[]
}

interface MenuItem {
  _id: string
  name: string
  path: string
  icon?: string
  parentId?: string
  sort: number
  children?: MenuItem[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as AdminUser | null,
    menus: [] as MenuItem[],
    menusCacheTime: 0 as number,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isMenusCacheValid: (state) => {
      if (state.menus.length === 0) return false
      const CACHE_DURATION = 5 * 60 * 1000
      return Date.now() - state.menusCacheTime < CACHE_DURATION
    },
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
      this.menus = []
      this.menusCacheTime = 0
    },

    async verifyToken() {
      try {
        const res = await verifyTokenApi()
        const data = res?.data
        if (data?.valid) {
          if (data.user) {
            this.user = data.user
          }
          return true
        } else {
          this.logout()
          return false
        }
      } catch (error) {
        this.logout()
        return false
      }
    },

    async fetchMenus(forceRefresh = false) {
      if (!forceRefresh && this.isMenusCacheValid) {
        return this.menus
      }
      
      try {
        const res: any = await request.get('/admin/menus')
        if (res?.success) {
          this.menus = res.data || []
          this.menusCacheTime = Date.now()
          return this.menus
        }
        return []
      } catch (error) {
        console.error('获取菜单失败:', error)
        return []
      }
    },

    hasMenuPath(path: string): boolean {
      const checkMenus = (menus: MenuItem[]): boolean => {
        for (const menu of menus) {
          if (menu.path === path) return true
          if (menu.children && checkMenus(menu.children)) return true
        }
        return false
      }
      return checkMenus(this.menus)
    }
  },

  persist: {
    key: 'admin-auth',
    paths: ['token', 'user', 'menus', 'menusCacheTime'],
  },
})
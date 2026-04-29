import { defineStore } from 'pinia'
import request from '@/api/request'
import { verifyToken as verifyTokenApi } from '@/api/auth'

interface AdminUser {
  _id?: string
  username?: string
  nickname?: string
  avatar?: string
  email?: string
  expiresAt?: string
  role?: string
  roleIds?: string[]
  roles?: Array<{
    _id: string
    name: string
    code: string
  }>
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
    expiresAt: '' as string,
    menus: [] as MenuItem[],
    menusCacheTime: 0 as number,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    displayName: (state) => state.user?.nickname || state.user?.username || '',
    userEmail: (state) => state.user?.email || '',
    userAvatar: (state) => state.user?.avatar || '',
    isAdminPlus: (state) =>
      !!state.token &&
      !(
        state.expiresAt &&
        new Date(state.expiresAt).getTime() <= Date.now()
      ) &&
      ((Array.isArray(state.user?.roles) &&
        state.user.roles.some((role) => role?.code === 'admin-plus')) ||
        state.user?.role === 'admin-plus'),
    isSessionExpired: (state) => {
      if (!state.expiresAt) return false
      return new Date(state.expiresAt).getTime() <= Date.now()
    },
    isMenusCacheValid: (state) => {
      if (state.menus.length === 0) return false
      const CACHE_DURATION = 5 * 60 * 1000
      return Date.now() - state.menusCacheTime < CACHE_DURATION
    },
  },

  actions: {
    setSession(payload: { token?: string; user?: AdminUser | null; expiresAt?: string | Date | null }) {
      this.token = payload.token || ''
      this.user = payload.user || null
      this.expiresAt = payload.expiresAt ? new Date(payload.expiresAt).toISOString() : ''
    },

    async login(username: string, password: string) {
      const res = await request.post('/admin/login', { username, password })
      const data = res?.data || res
      this.setSession({
        token: data?.token,
        user: data?.user || null,
        expiresAt: data?.expiresAt,
      })
      return data
    },

    logout() {
      this.setSession({})
      this.menus = []
      this.menusCacheTime = 0
    },

    async verifyToken() {
      try {
        const res = await verifyTokenApi()
        const data = res?.data
        if (data?.valid) {
          this.setSession({
            token: this.token,
            user: data.user || this.user,
            expiresAt: data.user?.expiresAt || this.expiresAt,
          })
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
    paths: ['token', 'user', 'expiresAt', 'menus', 'menusCacheTime'],
  },
})

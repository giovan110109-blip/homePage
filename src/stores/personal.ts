import { defineStore } from 'pinia'
import request from '@/api/request'
import type { PersonalInfo } from '@/types'

const defaultPersonal: PersonalInfo = {
  name: '',
  title: '',
  bio: '',
  avatar: '',
  email: '',
  location: '',
  wechat: '',
  socialLinks: [],
}

export const usePersonalStore = defineStore('personal', {
  state: () => ({
    info: { ...defaultPersonal } as PersonalInfo,
    loading: false,
    error: null as string | null
  }),

  getters: {
    fullName: (state) => state.info.name,
    contactEmail: (state) => state.info.email,
    socialLinks: (state) => state.info.socialLinks,
    avatar: (state) => state.info.avatar,
    wechat: (state) => state.info.wechat
  },

  actions: {
    async fetchPersonalInfo() {
      this.loading = true
      this.error = null
      try {
        const res = await request.get('/site-info')
        const payload = (res as any)?.data || res || {}
        const data = payload?.data || payload

        // Map siteInfo -> personal fields
        this.info = {
          name: data?.name || data?.siteName || defaultPersonal.name,
          title: data?.title || defaultPersonal.title,
          bio: data?.bio || defaultPersonal.bio,
          avatar: data?.avatar || defaultPersonal.avatar,
          email: data?.email || defaultPersonal.email,
          location: data?.location || defaultPersonal.location,
          wechat: data?.wechat || defaultPersonal.wechat,
          socialLinks: Array.isArray(data?.socialLinks) ? data.socialLinks : defaultPersonal.socialLinks,
        }
      } catch (err: any) {
        this.error = err?.message || '获取个人信息失败'
      } finally {
        this.loading = false
      }
    },
    updatePersonalInfo(newInfo: Partial<PersonalInfo>) {
      this.info = { ...this.info, ...newInfo }
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    }
  }
})
import { defineStore } from 'pinia'
import request from '@/api/request'
import type { SiteInfo } from '@/types/common'

const defaultSiteInfo: SiteInfo = {
  name: '',
  title: '',
  bio: '',
  avatar: '',
  email: '',
  wechat: '',
  location: '',
  website: '',
  activityStatus: '',
  activityStatusDate: '',
  socialLinks: [],
  siteName: '',
  siteTitle: '',
  siteDescription: '',
  siteLogo: '',
  icp: '',
  icpLink: '',
  publicSecurity: '',
  publicSecurityLink: '',
  footerContact: {
    email: '',
    phone: '',
    wechat: '',
    address: '',
  },
}

export const useSiteInfoStore = defineStore('siteInfo', {
  state: () => ({
    info: { ...defaultSiteInfo } as SiteInfo,
    loading: false,
    error: null as string | null,
    lastFetchTime: 0,
  }),

  getters: {
    shouldRefetch: (state): boolean => {
      const CACHE_DURATION = 5 * 60 * 1000
      return Date.now() - state.lastFetchTime > CACHE_DURATION
    },
  },

  actions: {
    async fetchSiteInfo(force = false) {
      if (!force && !this.shouldRefetch && this.info.name) {
        return
      }

      this.loading = true
      this.error = null
      try {
        const res = await request.get('/site-info')
        const payload = (res as any)?.data || res || {}
        const data = payload?.data || payload

        this.info = {
          ...defaultSiteInfo,
          ...data,
          footerContact: {
            ...defaultSiteInfo.footerContact,
            ...(data?.footerContact || {}),
          },
          socialLinks: Array.isArray(data?.socialLinks) ? data.socialLinks : [],
        }
        this.lastFetchTime = Date.now()
      } catch (error: any) {
        this.error = error?.message || '获取网站信息失败'
      } finally {
        this.loading = false
      }
    },

    setInfo(partial: Partial<SiteInfo>) {
      this.info = {
        ...this.info,
        ...partial,
        footerContact: {
          ...this.info.footerContact,
          ...(partial.footerContact || {}),
        },
      }
      this.lastFetchTime = Date.now()
    },

    async updateActivityStatus(activityStatus: string, activityStatusDate: string) {
      const res = await request.put('/admin/site-info/activity-status', {
        activityStatus,
        activityStatusDate,
      })
      const payload = (res as any)?.data || res || {}
      const data = payload?.data || payload
      this.setInfo({
        activityStatus: data?.activityStatus || activityStatus,
        activityStatusDate: data?.activityStatusDate || activityStatusDate,
      })
      return data
    },

    clearError() {
      this.error = null
    },
  },

  persist: {
    key: 'site-info',
    paths: ['info', 'lastFetchTime'],
  },
})

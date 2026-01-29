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
  }),

  actions: {
    async fetchSiteInfo() {
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
    },

    clearError() {
      this.error = null
    },
  },
})

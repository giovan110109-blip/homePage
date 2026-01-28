import { defineStore } from 'pinia'
import request from '@/api/request'

export interface SiteInfo {
  name: string
  title: string
  bio: string
  avatar: string
  email: string
  wechat: string
  location: string
  website: string
  socialLinks: Array<{ platform: string; url: string; icon?: string }>
  siteName: string
  siteTitle: string
  siteDescription: string
  siteLogo: string
  icp: string
  icpLink: string
  publicSecurity: string
  publicSecurityLink: string
  footerContact: {
    email: string
    phone: string
    wechat: string
    address: string
  }
}

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

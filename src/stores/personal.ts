import { defineStore } from 'pinia'
import type { PersonalInfo } from '@/types'
import personalData from '@/data/personal.json'

export const usePersonalStore = defineStore('personal', {
  state: () => ({
    info: personalData as PersonalInfo,
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
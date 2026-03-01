import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface VisitorInfo {
  name: string
  email: string
  website: string
}

const STORAGE_KEY = 'visitor_info'

export const useVisitorStore = defineStore('visitor', () => {
  const savedInfo = localStorage.getItem(STORAGE_KEY)
  const initialInfo: VisitorInfo = savedInfo 
    ? JSON.parse(savedInfo) 
    : { name: '', email: '', website: '' }

  const name = ref(initialInfo.name)
  const email = ref(initialInfo.email)
  const website = ref(initialInfo.website)

  watch(
    [name, email, website],
    () => {
      const info: VisitorInfo = {
        name: name.value,
        email: email.value,
        website: website.value
      }
      if (info.name || info.email || info.website) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    { deep: true }
  )

  const setInfo = (info: Partial<VisitorInfo>) => {
    if (info.name !== undefined) name.value = info.name
    if (info.email !== undefined) email.value = info.email
    if (info.website !== undefined) website.value = info.website
  }

  const getInfo = (): VisitorInfo => ({
    name: name.value,
    email: email.value,
    website: website.value
  })

  const hasInfo = () => !!(name.value && email.value)

  const clearInfo = () => {
    name.value = ''
    email.value = ''
    website.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    name,
    email,
    website,
    setInfo,
    getInfo,
    hasInfo,
    clearInfo
  }
})

import { ref } from 'vue'

export type TableResponse<T> = {
  data?: T[]
  meta?: {
    total?: number
  }
}

export type TableFetcher<T, P = any> = (params?: P) => Promise<TableResponse<T> | any>

export const useTableFetch = <T, P = any>(fetcher: TableFetcher<T, P>) => {
  const data = ref<T[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const normalize = (payload: any) => {
    const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
    const totalValue = payload?.meta?.total ?? 0
    return { items, totalValue }
  }

  const fetch = async (params?: P) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetcher(params)
      const { items, totalValue } = normalize(res)
      data.value = items
      total.value = totalValue
    } catch (err: any) {
      error.value = err?.message || '加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    total,
    loading,
    error,
    fetch,
  }
}

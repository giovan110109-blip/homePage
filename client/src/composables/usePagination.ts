import { ref, computed, type Ref, type ComputedRef, shallowRef } from 'vue'

interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  pageCount: number
}

interface UsePaginationOptions<T> {
  fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; meta: PaginationMeta }>
  pageSize?: number
  mode?: 'loadMore' | 'page'
}

interface UsePaginationReturn<T> {
  data: Ref<T[]>
  loading: Ref<boolean>
  loadingMore: Ref<boolean>
  hasMore: ComputedRef<boolean>
  currentPage: Ref<number>
  meta: Ref<PaginationMeta>
  fetch: (isLoadMore?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  goToPage: (page: number) => Promise<void>
  visiblePages: ComputedRef<(number | string)[]>
}

export function usePagination<T>(options: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const { fetcher, pageSize = 10, mode = 'loadMore' } = options

  const data: Ref<T[]> = shallowRef<T[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const currentPage = ref(1)
  const meta = ref<PaginationMeta>({
    page: 1,
    pageSize,
    total: 0,
    pageCount: 1,
  })

  const hasMore = computed(() => currentPage.value < meta.value.pageCount)

  const visiblePages = computed(() => {
    const current = meta.value.page
    const total = meta.value.pageCount
    if (total <= 1) return [1]

    const delta = 2
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i)
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total)
    } else if (total > 1) {
      rangeWithDots.push(total)
    }

    return rangeWithDots.filter((v, i, a) => a.indexOf(v) === i)
  })

  const fetch = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        loadingMore.value = true
      } else {
        loading.value = true
      }

      const result = await fetcher(currentPage.value, pageSize)

      if (isLoadMore) {
        data.value = [...data.value, ...result.data]
      } else {
        data.value = result.data
      }

      meta.value = result.meta
    } catch (error) {
      console.error('Pagination fetch error:', error)
      throw error
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMore.value || loadingMore.value) return
    currentPage.value++
    await fetch(true)
  }

  const goToPage = async (page: number) => {
    if (page < 1 || page > meta.value.pageCount) return
    currentPage.value = page
    await fetch(false)
  }

  const refresh = async () => {
    currentPage.value = 1
    await fetch(false)
  }

  const reset = () => {
    data.value = []
    currentPage.value = 1
    meta.value = { page: 1, pageSize, total: 0, pageCount: 1 }
    loading.value = false
    loadingMore.value = false
  }

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    meta,
    fetch,
    loadMore,
    refresh,
    reset,
    goToPage,
    visiblePages,
  }
}

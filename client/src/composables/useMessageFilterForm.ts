import { reactive } from 'vue'

export interface TableFilterForm {
  [key: string]: any
  page: number
  pageSize: number
}

export interface FilterOptions {
  page?: number
  pageSize?: number
  [key: string]: any
}

/**
 * 通用表格过滤表单组合式函数
 * @param initialOptions 初始配置选项
 * @example
 * const filter = useMessageFilterForm({ pageSize: 20, status: '', category: '' })
 * const filter = useMessageFilterForm({ pageSize: 10 })
 */
export const useMessageFilterForm = (initialOptions: FilterOptions = {}) => {
  const form = reactive<TableFilterForm>({
    page: initialOptions.page ?? 1,
    pageSize: initialOptions.pageSize ?? 20,
    ...Object.fromEntries(
      Object.entries(initialOptions)
        .filter(([key]) => key !== 'page' && key !== 'pageSize')
        .map(([key, value]) => [key, value ?? ''])
    ),
  })

  const reset = () => {
    form.page = initialOptions.page ?? 1
    form.pageSize = initialOptions.pageSize ?? 20
    Object.keys(form).forEach((key) => {
      if (key !== 'page' && key !== 'pageSize') {
        form[key] = ''
      }
    })
  }

  const toParams = () => {
    const params: Record<string, any> = {
      page: form.page,
      pageSize: form.pageSize,
    }
    Object.entries(form).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'pageSize' && value) {
        params[key] = value
      }
    })
    return params
  }

  return {
    form,
    reset,
    toParams,
  }
}

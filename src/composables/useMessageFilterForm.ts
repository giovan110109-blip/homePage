import { reactive } from 'vue'

export interface MessageFilterForm {
  keyword: string
  status: '' | 'approved' | 'pending'
  page: number
  pageSize: number
}

export const useMessageFilterForm = () => {
  const form = reactive<MessageFilterForm>({
    keyword: '',
    status: '',
    page: 1,
    pageSize: 10,
  })

  const reset = () => {
    form.keyword = ''
    form.status = ''
    form.page = 1
    form.pageSize = 10
  }

  const toParams = () => ({
    page: form.page,
    pageSize: form.pageSize,
    status: form.status || undefined,
  })

  return {
    form,
    reset,
    toParams,
  }
}
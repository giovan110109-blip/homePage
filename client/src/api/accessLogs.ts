import request from './request'
import type { ApiResponse } from '@/types/api'

interface PageViewPayload {
  path: string
  title?: string
}

export function recordPageView(payload: PageViewPayload): Promise<ApiResponse<null>> {
  return request.post('/access-logs/ping', payload)
}

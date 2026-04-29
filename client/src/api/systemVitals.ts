import request from './request'
import type { ApiResponse } from '@/types/api'

export interface SystemVitals {
  uptime: number
  latency: number
  deployedAt: string
  todayVisits: number
  recentError: {
    path: string
    status: number
    time: string
  } | null
  checkedAt: string
}

export function getSystemVitals(): Promise<ApiResponse<SystemVitals>> {
  return request.get('/system-vitals')
}

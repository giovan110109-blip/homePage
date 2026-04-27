/**
 * 仪表板 API
 */

import request from './request'
import type { ApiResponse } from '@/types/api'
import { withApi, type ApiResult } from './utils'

export interface DashboardStats {
  messages: {
    total: number
    new: number
    growth: string
  }
  articles: {
    total: number
    published: number
    draft: number
  }
  photos: {
    total: number
    new: number
    growth: string
  }
  reactions: {
    total: number
    new: number
    growth: string
    byType: Record<string, number>
  }
  access: {
    total: number
    new: number
    growth: string
  }
}

export function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return request.get('/admin/dashboard/stats')
}

export function getDashboardStatsSafe(): Promise<ApiResult<DashboardStats>> {
  return withApi(getDashboardStats())
}

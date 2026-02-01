/**
 * 仪表板 API
 */

import request from './request'

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

/**
 * 获取仪表板统计数据
 */
export function getDashboardStats() {
  return request<DashboardStats>({
    url: '/admin/dashboard/stats',
    method: 'GET'
  })
}

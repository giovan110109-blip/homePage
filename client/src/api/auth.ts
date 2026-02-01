/**
 * 认证相关 API
 */

import request from './request'

export interface VerifyResponse {
  valid: boolean
  user?: {
    _id: string
    username: string
    nickname?: string
    avatar?: string
    email?: string
  }
}

/**
 * 验证 token 是否有效
 */
export function verifyToken(): Promise<any> {
  return request<VerifyResponse>({
    url: '/admin/verify',
    method: 'GET'
  })
}

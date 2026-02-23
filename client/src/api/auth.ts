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

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

export interface QrSessionData {
  qrToken: string
}

export interface QrStatusData {
  status: 'pending' | 'scanned' | 'confirmed'
  userInfo?: {
    _id: string
    nickname?: string
    avatar?: string
    role: string
  }
  token?: string
  user?: {
    _id: string
    nickname?: string
    avatar?: string
    role: string
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

/**
 * 创建扫码登录会话
 */
export function createQrSession(): Promise<ApiResponse<QrSessionData>> {
  return request<ApiResponse<QrSessionData>>({
    url: '/auth/create-qr-session',
    method: 'POST'
  })
}

/**
 * 获取小程序码图片URL
 */
export function getQrCodeUrl(qrToken: string): string {
  if (import.meta.env.DEV) {
    return `/api/auth/generate-qr-code?qrToken=${qrToken}`
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://serve.giovan.cn/api'
  return `${baseUrl}/auth/generate-qr-code?qrToken=${qrToken}`
}

/**
 * 检查扫码登录状态
 */
export function checkQrStatus(qrToken: string): Promise<ApiResponse<QrStatusData>> {
  return request<ApiResponse<QrStatusData>>({
    url: `/auth/check-qr-status/${qrToken}`,
    method: 'GET'
  })
}

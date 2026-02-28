/**
 * 认证相关 API
 */

import request from './request'
import type { ApiResponse } from '@/types/api'
import { withApi, type ApiResult } from './utils'

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

export function verifyToken(): Promise<ApiResponse<VerifyResponse>> {
  return request.get('/admin/verify')
}

export function verifyTokenSafe(): Promise<ApiResult<VerifyResponse>> {
  return withApi(verifyToken())
}

export function createQrSession(): Promise<ApiResponse<QrSessionData>> {
  return request.post('/auth/create-qr-session')
}

export function createQrSessionSafe(): Promise<ApiResult<QrSessionData>> {
  return withApi(createQrSession())
}

export function getQrCodeUrl(qrToken: string): string {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://serve.giovan.cn'
  const baseUrl = rawBaseUrl.replace(/\/$/, '').endsWith('/api') 
    ? rawBaseUrl.replace(/\/$/, '') 
    : `${rawBaseUrl.replace(/\/$/, '')}/api`
  return `${baseUrl}/auth/generate-qr-code?qrToken=${qrToken}`
}

export function checkQrStatus(qrToken: string): Promise<ApiResponse<QrStatusData>> {
  return request.get(`/auth/check-qr-status/${qrToken}`)
}

export function checkQrStatusSafe(qrToken: string): Promise<ApiResult<QrStatusData>> {
  return withApi(checkQrStatus(qrToken))
}

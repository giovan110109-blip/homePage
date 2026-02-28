/**
 * 友情链接 API
 */

import request from './request'
import type { 
  FriendLink, 
  FriendLinkFormData, 
  FriendLinkListResponse,
  FriendLinkReviewData,
  ApiResponse
} from '@/types/api'
import { withApi, type ApiResult } from './utils'

// ==================== 前台接口 ====================

export function getFriendLinks(): Promise<ApiResponse<FriendLink[]>> {
  return request.get('/friend-links')
}

export function getFriendLinksSafe(): Promise<ApiResult<FriendLink[]>> {
  return withApi(getFriendLinks())
}

export function applyFriendLink(data: FriendLinkFormData): Promise<ApiResponse<FriendLink>> {
  return request.post('/friend-links', data)
}

export function applyFriendLinkSafe(data: FriendLinkFormData): Promise<ApiResult<FriendLink>> {
  return withApi(applyFriendLink(data))
}

export function recordFriendLinkClick(id: string): Promise<ApiResponse<void>> {
  return request.post(`/friend-links/${id}/click`)
}

// ==================== 管理后台接口 ====================

export interface AdminFriendLinksParams {
  page?: number
  pageSize?: number
  status?: string
  isActive?: boolean
  category?: string
}

export function adminGetFriendLinks(params?: AdminFriendLinksParams): Promise<ApiResponse<FriendLinkListResponse>> {
  return request.get('/admin/friend-links', { params })
}

export function adminGetFriendLinksSafe(params?: AdminFriendLinksParams): Promise<ApiResult<FriendLinkListResponse>> {
  return withApi(adminGetFriendLinks(params))
}

export function adminGetFriendLinkById(id: string): Promise<ApiResponse<FriendLink>> {
  return request.get(`/admin/friend-links/${id}`)
}

export function adminGetFriendLinkByIdSafe(id: string): Promise<ApiResult<FriendLink>> {
  return withApi(adminGetFriendLinkById(id))
}

export function adminUpdateFriendLink(id: string, data: Partial<FriendLink>): Promise<ApiResponse<FriendLink>> {
  return request.put(`/admin/friend-links/${id}`, data)
}

export function adminUpdateFriendLinkSafe(id: string, data: Partial<FriendLink>): Promise<ApiResult<FriendLink>> {
  return withApi(adminUpdateFriendLink(id, data))
}

export function adminReviewFriendLink(id: string, data: FriendLinkReviewData): Promise<ApiResponse<FriendLink>> {
  return request.put(`/admin/friend-links/${id}/review`, data)
}

export function adminReviewFriendLinkSafe(id: string, data: FriendLinkReviewData): Promise<ApiResult<FriendLink>> {
  return withApi(adminReviewFriendLink(id, data))
}

export function adminDeleteFriendLink(id: string): Promise<ApiResponse<void>> {
  return request.delete(`/admin/friend-links/${id}`)
}

export function adminDeleteFriendLinkSafe(id: string): Promise<ApiResult<void>> {
  return withApi(adminDeleteFriendLink(id))
}

export function adminUpdateFriendLinkSort(updates: Array<{ id: string; sort: number }>): Promise<ApiResponse<void>> {
  return request.put('/admin/friend-links/sort', { updates })
}

export function adminUpdateFriendLinkSortSafe(updates: Array<{ id: string; sort: number }>): Promise<ApiResult<void>> {
  return withApi(adminUpdateFriendLinkSort(updates))
}

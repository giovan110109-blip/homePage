/**
 * 友情链接 API
 */

import request from './request'
import type { 
  FriendLink, 
  FriendLinkFormData, 
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

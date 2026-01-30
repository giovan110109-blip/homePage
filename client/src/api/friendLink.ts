/**
 * 友情链接 API
 */

import request from './request'
import type { 
  FriendLink, 
  FriendLinkFormData, 
  FriendLinkListResponse,
  FriendLinkReviewData 
} from '@/types/api'

// ==================== 前台接口 ====================

/**
 * 获取已通过的友情链接列表
 */
export function getFriendLinks() {
  return request<FriendLink[]>({
    url: '/friend-links',
    method: 'GET'
  })
}

/**
 * 申请友情链接
 */
export function applyFriendLink(data: FriendLinkFormData) {
  return request<FriendLink>({
    url: '/friend-links',
    method: 'POST',
    data
  })
}

/**
 * 记录点击
 */
export function recordFriendLinkClick(id: string) {
  return request({
    url: `/friend-links/${id}/click`,
    method: 'POST'
  })
}

// ==================== 管理后台接口 ====================

/**
 * 分页查询所有友情链接
 */
export function adminGetFriendLinks(params?: {
  page?: number
  pageSize?: number
  status?: string
  isActive?: boolean
  category?: string
}) {
  return request<FriendLinkListResponse>({
    url: '/admin/friend-links',
    method: 'GET',
    params
  })
}

/**
 * 获取单个友情链接详情
 */
export function adminGetFriendLinkById(id: string) {
  return request<FriendLink>({
    url: `/admin/friend-links/${id}`,
    method: 'GET'
  })
}

/**
 * 更新友情链接
 */
export function adminUpdateFriendLink(id: string, data: Partial<FriendLink>) {
  return request<FriendLink>({
    url: `/admin/friend-links/${id}`,
    method: 'PUT',
    data
  })
}

/**
 * 审核友情链接
 */
export function adminReviewFriendLink(id: string, data: FriendLinkReviewData) {
  return request<FriendLink>({
    url: `/admin/friend-links/${id}/review`,
    method: 'PUT',
    data
  })
}

/**
 * 删除友情链接
 */
export function adminDeleteFriendLink(id: string) {
  return request({
    url: `/admin/friend-links/${id}`,
    method: 'DELETE'
  })
}

/**
 * 批量更新排序
 */
export function adminUpdateFriendLinkSort(updates: Array<{ id: string; sort: number }>) {
  return request({
    url: '/admin/friend-links/sort',
    method: 'PUT',
    data: { updates }
  })
}

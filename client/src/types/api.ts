/**
 * API-related Types
 * Contains request and response types for API operations
 */

// ==================== 友情链接相关类型 ====================

export interface FriendLink {
  _id: string
  name: string                    // 网站名称
  url: string                     // 网站链接
  description: string             // 网站描述
  avatar?: string                 // 网站头像/Logo
  email: string                   // 联系邮箱
  rss?: string                    // RSS 订阅地址
  category: string                // 分类
  tags?: string[]                 // 标签
  status: 'pending' | 'approved' | 'rejected'  // 审核状态
  reason?: string                 // 拒绝原因
  sort: number                    // 排序权重
  isActive: boolean               // 是否显示
  clicks: number                  // 点击次数
  lastClickedAt?: string          // 最后点击时间
  reviewedAt?: string             // 审核时间
  reviewedBy?: string             // 审核人
  createdAt: string               // 创建时间
  updatedAt: string               // 更新时间
}

export interface FriendLinkFormData {
  name: string
  url: string
  description: string
  avatar?: string
  email: string
  rss?: string
  category?: string
  tags?: string[]
}

export interface FriendLinkListResponse {
  list: FriendLink[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FriendLinkReviewData {
  status: 'approved' | 'rejected'
  reason?: string
}


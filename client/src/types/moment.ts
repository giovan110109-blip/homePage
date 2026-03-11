export interface MomentMedia {
  url: string
  thumbnailUrl?: string
  thumbHash?: string
  width?: number
  height?: number
  photoId?: string
  isPrivate?: boolean
  isLive?: boolean
  videoUrl?: string
  originalFileUrl?: string
}

export interface MomentLivePhoto {
  imageUrl?: string
  videoUrl?: string
  imagePhotoId?: string
  videoPhotoId?: string
  width?: number
  height?: number
}

export interface MomentVideo {
  url: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
}

export interface MomentLocation {
  latitude?: number
  longitude?: number
  name?: string
  address?: string
}

export interface MomentAuthor {
  _id?: string
  name?: string
  avatar?: string
}

export interface Moment {
  _id: string
  content: string
  type: 'text' | 'image' | 'video' | 'live'
  mode: 'livePhoto' | 'video'
  media: MomentMedia[]
  livePhoto?: MomentLivePhoto
  video?: MomentVideo
  location?: MomentLocation
  author: MomentAuthor
  likes: number
  comments: number
  isLiked: boolean
  reactions?: Record<string, number>
  createdAt: string
}

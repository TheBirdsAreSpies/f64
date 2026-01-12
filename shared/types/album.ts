import type { Photo } from "./photo"
import type { Tag } from "./tag"

export interface Album {
  id: string
  slug: string
  title: string
  description: string | null
  visibility: string
  coverPhotoId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string | null
  photos?: Photo[]
  tags?: Tag[]
  coverPhoto?: {
    thumbnailPath: string
    title: string | null
    rotation: number | null
  }
  _count?: {
    photos?: number
  }
}

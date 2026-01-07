export interface Photo {
  id: string
  title: string
  description: string | null
  filename: string
  originalPath: string
  thumbnailPath: string
  width: number
  height: number
  fileSize: number
  mimeType: string
  exifData: string | null
  visibility: string
  uploadedAt: string
  uploadedBy: string
  takenAt: string | null
  cameraMake?: string | null
  cameraModel?: string | null
  exposureTime?: number | null
  fNumber?: number | null
  iso?: number | null
  focalLength?: number | null
  lensModel?: string | null
  rotation?: number
  _count?: {
    likes?: number
    comments?: number
  }
}

export interface PhotoDetail extends Photo {
  tags?: Array<{ id: string, name: string }>
  albums?: Array<{ id: string, title: string }>
}

export interface PhotosResponse {
  photos: Photo[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

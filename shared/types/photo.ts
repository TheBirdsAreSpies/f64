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
  _count?: {
    likes?: number
  }
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

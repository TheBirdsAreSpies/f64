import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const slug = getRouterParam(event, "slug")

  const hasPermission = await hasRole(session, "admin")
  if (!hasPermission.isValid) {
    throw createError({ statusCode: 403, message: "Forbidden" })
  }

  if (!slug) {
    throw createError({ statusCode: 400, message: "Album slug is required" })
  }

  const album = await prisma.album.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!album) {
    throw createError({ statusCode: 404, message: "Album not found" })
  }

  const photos = await prisma.photo.findMany({
    where: {
      albums: {
        some: {
          id: album.id,
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailPath: true,
      originalPath: true,
      visibility: true,
      rotation: true,
      uploadedAt: true,
      width: true,
      height: true,
      fileSize: true,
      mimeType: true,
      cameraMake: true,
      cameraModel: true,
      exposureTime: true,
      fNumber: true,
      iso: true,
      focalLength: true,
      lensModel: true,
      takenAt: true,
      tags: true,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
  })

  return photos
})

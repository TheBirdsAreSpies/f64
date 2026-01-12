import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const hasPermission = await hasRole(session, "admin")
  if (!hasPermission.isValid) {
    throw createError({ statusCode: 403, message: "Forbidden" })
  }

  const slug = getRouterParam(event, "slug")
  const photoId = getRouterParam(event, "photoId")

  if (!slug) {
    throw createError({ statusCode: 400, message: "Album slug is required" })
  }

  if (!photoId) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  const album = await prisma.album.findUnique({
    where: { slug },
    select: { id: true, coverPhotoId: true },
  })

  if (!album) {
    throw createError({ statusCode: 404, message: "Album not found" })
  }

  const photo = await prisma.photo.findFirst({
    where: {
      id: photoId,
      albums: {
        some: {
          id: album.id,
        },
      },
    },
  })

  if (!photo) {
    throw createError({ statusCode: 404, message: "Photo not found in this album" })
  }

  await prisma.photo.update({
    where: { id: photoId },
    data: {
      albums: {
        disconnect: { id: album.id },
      },
    },
  })

  // If this was the cover photo, reset it
  if (album.coverPhotoId === photoId) {
    await prisma.album.update({
      where: { id: album.id },
      data: {
        coverPhotoId: null,
      },
    })
  }

  return { success: true, message: "Photo removed from album" }
})

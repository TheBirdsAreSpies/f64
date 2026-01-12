import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const hasPermission = await hasRole(session, "admin")
  if (!hasPermission.isValid) {
    throw createError({ statusCode: 403, message: "Forbidden" })
  }

  const slug = getRouterParam(event, "slug")
  if (!slug) {
    throw createError({ statusCode: 400, message: "Album slug is required" })
  }

  const body = await readBody<{ photoIds?: string[] }>(event)
  const photoIds = Array.isArray(body?.photoIds) ? body!.photoIds!.filter(Boolean) : []
  if (!photoIds.length) {
    throw createError({ statusCode: 400, message: "photoIds is required" })
  }

  const album = await prisma.album.findUnique({
    where: { slug },
    select: { id: true, coverPhotoId: true },
  })

  if (!album) {
    throw createError({ statusCode: 404, message: "Album not found" })
  }

  const photos = await prisma.photo.findMany({
    where: {
      id: { in: photoIds },
      albums: { some: { id: album.id } },
    },
    select: { id: true },
  })

  if (!photos.length) {
    throw createError({ statusCode: 404, message: "No matching photos found in this album" })
  }

  const idsToRemove = photos.map(p => p.id)

  await prisma.$transaction([
    ...idsToRemove.map(id => prisma.photo.update({
      where: { id },
      data: { albums: { disconnect: { id: album.id } } },
    })),
    ...(album.coverPhotoId && idsToRemove.includes(album.coverPhotoId)
      ? [prisma.album.update({ where: { id: album.id }, data: { coverPhotoId: null } })]
      : []),
  ])

  return { success: true, removedCount: idsToRemove.length }
})

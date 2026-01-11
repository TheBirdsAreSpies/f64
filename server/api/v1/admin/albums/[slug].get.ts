import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const slug = getRouterParam(event, "slug")

  // TODO permissions

  const album = await prisma.album.findUnique({
    where: { slug },
    include: {
      tags: true,
      photos: {
        orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          originalPath: true,
          thumbnailPath: true,
          rotation: true,
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
            select: { likes: true, comments: true },
          },
        },
      },
      coverPhoto: true,
      _count: {
        select: { photos: true },
      },
    },
  })

  if (!album) {
    throw createError({ statusCode: 404, message: "Album not found" })
  }

  const { password: _, ...albumData } = album

  return albumData
})

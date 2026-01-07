import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Album slug is required",
    })
  }

  const album = await prisma.album.findUnique({
    where: { slug },
    include: {
      tags: true,
      photos: {
        where: { visibility: "public" },
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
    },
  })

  if (!album) {
    throw createError({ statusCode: 404, message: "Album not found" })
  }

  const session = await getUserSession(event)
  if (album.visibility === "private" && !session.user) {
    throw createError({ statusCode: 403, message: "This album is private" })
  }

  if (album.visibility === "password") {
    const password = getHeader(event, "x-album-password")
    if (!password || !album.password) {
      throw createError({ statusCode: 403, message: "Password required" })
    }

    const isValid = await verifyPassword(album.password, password)
    if (!isValid) {
      throw createError({ statusCode: 403, message: "Invalid password" })
    }
  }

  const { password: _, ...albumData } = album

  return albumData
})

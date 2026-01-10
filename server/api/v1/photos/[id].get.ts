import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const photoId = getRouterParam(event, "id")

  if (!photoId) {
    throw createError({ statusCode: 400, statusMessage: "Photo ID is required" })
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
      albums: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  if (!photo) {
    throw createError({
      statusCode: 404,
      statusMessage: "Photo not found",
    })
  }

  const session = await getUserSession(event)

  if (photo.visibility === "private" && (!session?.user || session.user.id !== photo.uploadedBy)) {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  return photo
})

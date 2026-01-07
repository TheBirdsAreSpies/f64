import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const photoId = getRouterParam(event, "id")

  if (!photoId) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  const existing = await prisma.like.findUnique({
    where: {
      photoId_userId: {
        photoId,
        userId: user.id,
      },
    },
  })

  if (existing) {
    await prisma.like.delete({
      where: { id: existing.id },
    })

    return { liked: false }
  } else {
    await prisma.like.create({
      data: {
        photoId,
        userId: user.id,
      },
    })

    return { liked: true }
  }
})

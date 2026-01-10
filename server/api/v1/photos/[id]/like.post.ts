import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const photoId = getRouterParam(event, "id")

  const userId = session.user?.id

  if (!photoId) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  if (!userId) {
    throw createError({ statusCode: 401, message: "User ID not found" })
  }

  try {
    const existing = await prisma.like.findUnique({
      where: {
        photoId_userId: {
          photoId,
          userId,
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
          userId,
        },
      })

      return { liked: true }
    }
  } catch (error: any) {
    console.error("Like operation error:", error.message)
    if (error.code === "P2003") {
      throw createError({ statusCode: 400, message: "Photo or user not found" })
    }
    throw createError({ statusCode: 500, message: "Failed to update like" })
  }
})

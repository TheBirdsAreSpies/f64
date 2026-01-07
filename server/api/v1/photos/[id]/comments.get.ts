import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const photoId = getRouterParam(event, "id")

  if (!photoId) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  const comments = await prisma.comment.findMany({
    where: { photoId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return comments
})

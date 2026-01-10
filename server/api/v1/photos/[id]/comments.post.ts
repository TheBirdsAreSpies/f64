import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const photoId = getRouterParam(event, "id")
  const body = await readBody(event)

  const userId = session.user?.id

  if (!photoId) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  if (!userId) {
    throw createError({ statusCode: 401, message: "User ID not found" })
  }

  if (!body.content || !body.content.trim()) {
    throw createError({ statusCode: 400, message: "Comment content is required" })
  }

  const comment = await prisma.comment.create({
    data: {
      content: body.content.trim(),
      photoId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return comment
})

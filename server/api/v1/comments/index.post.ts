import { prisma } from "~~/lib/prisma"
import { commentCreateSchema } from "~~/server/schemas/comment.schema"

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody(event)
  const validated = commentCreateSchema.parse(body)

  const photo = await prisma.photo.findUnique({
    where: { id: validated.photoId },
  })

  if (!photo) {
    throw createError({ statusCode: 404, message: "Photo not found" })
  }

  const comment = await prisma.comment.create({
    data: {
      content: validated.content,
      photoId: validated.photoId,
      userId: user.id,
    },
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
  })

  return comment
})

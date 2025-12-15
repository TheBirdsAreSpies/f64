import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: {
      tags: true,
      albums: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!photo) {
    throw createError({ statusCode: 404, message: "Photo not found" })
  }

  return photo
})

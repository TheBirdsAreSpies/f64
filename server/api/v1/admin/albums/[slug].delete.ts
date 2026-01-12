import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const slug = getRouterParam(event, "slug")

  await hasRole(session, "admin")

  if (!slug) {
    throw createError({ statusCode: 400, message: "Album slug is required" })
  }

  const album = await prisma.album.findUnique({
    where: { slug },
  })

  if (!album) {
    throw createError({ statusCode: 404, message: "Album not found" })
  }

  await prisma.album.delete({
    where: { slug },
  })

  return { success: true }
})

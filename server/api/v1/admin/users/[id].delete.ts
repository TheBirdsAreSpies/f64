import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "User ID is required" })
  }

  if (id === session.user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot delete your own account" })
  }

  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  await prisma.user.delete({
    where: { id },
  })

  return {
    success: true,
    message: "User deleted successfully",
  }
})

import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const employee = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: {
        include: {
          permissions: {
            select: { id: true, code: true, name: true, category: true, description: true },
            where: { isActive: true },
          },
        },
      },
    },
  })

  if (!employee) {
    await logAction("User not found", event.path, session, "warn")
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    })
  }

  const permissions = employee.roles.flatMap(role => role.permissions)

  const uniquePermissions = Array.from(
    new Map(permissions.map(p => [p.id, p])).values(),
  )

  await logAction("Fetched user permissions", event.path, session)

  return {
    success: true,
    userId: session.user.id,
    roles: employee.roles.map(r => r.name),
    permissions: uniquePermissions,
  }
})

import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "User ID is required" })
  }

  const body = await readBody(event)

  const user = await prisma.user.findUnique({
    where: { id },
    include: { roles: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  if (body.emailVerified !== undefined) {
    await prisma.user.update({
      where: { id },
      data: {
        emailVerified: body.emailVerified,
      },
    })
  }

  if (body.roleIds && Array.isArray(body.roleIds)) {
    await prisma.user.update({
      where: { id },
      data: {
        roles: {
          set: [],
        },
      },
    })

    await prisma.user.update({
      where: { id },
      data: {
        roles: {
          connect: body.roleIds.map((roleId: string) => ({ id: roleId })),
        },
      },
    })
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      createdAt: true,
      roles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return updatedUser
})

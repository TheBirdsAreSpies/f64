import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
          description: true,
        },
      },
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    })
  }

  return user
})

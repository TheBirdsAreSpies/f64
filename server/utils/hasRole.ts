import type { UserSessionRequired } from "#auth-utils"
import { prisma } from "~~/lib/prisma"

export async function hasRole(session: UserSessionRequired, role: string): Promise<{ isValid: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: true,
    },
  })

  if (!user) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" })
  }

  const isRoleValid = user!.roles.find(r => r.name === role) !== undefined
  if (!isRoleValid) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" })
  }

  return { isValid: isRoleValid }
}

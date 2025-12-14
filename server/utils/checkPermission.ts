import type { UserSessionRequired } from "#auth-utils"
import type { Permission } from "~~/server/types/permissions"
import { prisma } from "~~/lib/prisma"

export async function checkPermission(session: UserSessionRequired, permission: Permission): Promise<{ isValid: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
    },
  })

  if (!user) {
    return { isValid: false }
  }

  const isPermissionValid = user!.roles.some(role =>
    role.permissions?.some(p => p.code === permission),
  )

  return { isValid: isPermissionValid }
}

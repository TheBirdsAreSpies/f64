import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const query = getQuery(event)
  const page = Number.parseInt(query.page as string) || 1
  const limit = Number.parseInt(query.limit as string) || 20
  const search = query.search as string | undefined

  const where: any = {}

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
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
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})

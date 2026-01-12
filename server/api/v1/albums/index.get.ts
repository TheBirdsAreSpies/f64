import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const visibility = query.visibility as string | undefined

  const where: any = {}

  let isAdmin = false
  if (session.user) {
    const adminCheck = await hasRole(session as any, "admin")
    isAdmin = adminCheck.isValid
  }

  // Filter by visibility - only show public and password-protected albums for non-admin users
  if (!isAdmin) {
    where.visibility = { not: "private" }
  } else if (visibility) {
    where.visibility = visibility
  }

  const [albums, total] = await Promise.all([
    prisma.album.findMany({
      where,
      include: {
        tags: true,
        coverPhoto: {
          select: {
            thumbnailPath: true,
            title: true,
            rotation: true,
          },
        },
        photos: {
          select: {
            thumbnailPath: true,
            title: true,
            rotation: true,
          },
          orderBy: { id: "desc" },
          take: 1,
        },
        _count: {
          select: { photos: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.album.count({ where }),
  ])

  return {
    albums,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})

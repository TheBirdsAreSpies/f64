import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const visibility = query.visibility as string | undefined

  const where: any = {}

  // Filter by visibility - only show public albums unless user has permission
  const session = await getUserSession(event)
  if (!session.user) {
    where.visibility = "public"
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

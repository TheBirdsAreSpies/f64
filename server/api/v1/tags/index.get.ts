import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 50

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            photos: true,
          },
        },
      },
    }),
    prisma.tag.count(),
  ])

  return {
    tags,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})

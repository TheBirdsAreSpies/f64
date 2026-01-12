import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)

    const query = getQuery(event)
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    const visibility = query.visibility as string | undefined
    const search = query.search as string | undefined
    const tags = (query.tags as string | undefined)?.split(",").filter(Boolean)

    const whereConditions: any[] = []

    let isAdmin = false
    if (session.user) {
      const adminCheck = await hasRole(session as any, "admin")
      isAdmin = adminCheck.isValid
    }

    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      })
    }

    if (tags && tags.length > 0) {
      whereConditions.push({
        tags: {
          some: {
            name: { in: tags },
          },
        },
      })
    }

    if (!isAdmin) {
      whereConditions.push({ visibility: { not: "private" } })
    } else if (visibility) {
      const visibilityList = visibility.split(",")
      if (visibilityList.length > 1) {
        whereConditions.push({ visibility: { in: visibilityList } })
      } else {
        whereConditions.push({ visibility: visibilityList[0] })
      }
    }

    const finalWhere = whereConditions.length > 0 ? { AND: whereConditions } : {}

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where: finalWhere,
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
      prisma.album.count({ where: finalWhere }),
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
  } catch (error) {
    console.error("Error fetching albums:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch albums",
      data: error,
    })
  }
})

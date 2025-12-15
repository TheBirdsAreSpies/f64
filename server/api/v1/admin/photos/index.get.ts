import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const query = getQuery(event)
  const page = Number.parseInt(query.page as string) || 1
  const limit = Number.parseInt(query.limit as string) || 20
  const filter = query.filter as string | undefined
  const year = query.year ? Number.parseInt(query.year as string) : undefined

  // Build where clause based on filters
  const where: any = {}

  if (filter === "my-photos") {
    where.uploadedBy = session.user.id
  } else if (filter === "favorites") {
    where.isFavorite = true
  } else if (filter === "featured") {
    where.isFeatured = true
  } else if (filter === "private") {
    where.visibility = "private"
  } else if (filter === "last-import") {
    // Get photos from the last import session (last 24 hours by default)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    where.uploadedAt = {
      gte: yesterday,
    }
  }

  if (year) {
    where.uploadedAt = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    }
  }

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        title: true,
        thumbnailPath: true,
        originalPath: true,
        visibility: true,
        uploadedAt: true,
        isFavorite: true,
        isFeatured: true,
        width: true,
        height: true,
      },
    }),
    prisma.photo.count({ where }),
  ])

  return {
    photos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})

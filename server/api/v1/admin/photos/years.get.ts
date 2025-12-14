import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const photos = await prisma.photo.findMany({
    select: {
      uploadedAt: true,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  })

  const yearCounts = photos.reduce((acc, photo) => {
    const year = new Date(photo.uploadedAt).getFullYear()
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const years = Object.entries(yearCounts)
    .map(([year, count]) => ({
      year: Number.parseInt(year),
      count,
    }))
    .sort((a, b) => b.year - a.year)

  return years
})

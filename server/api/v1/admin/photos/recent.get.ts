import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  await logAction("Fetching recent photos", event.path, session)

  const photos = await prisma.photo.findMany({
    take: 5,
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      title: true,
      thumbnailPath: true,
      rotation: true,
      uploadedAt: true,
    },
  })

  return photos
})

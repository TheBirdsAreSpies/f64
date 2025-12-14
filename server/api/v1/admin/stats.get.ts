import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const [photos, albums, likes, storageData] = await Promise.all([
    prisma.photo.count(),
    prisma.album.count(),
    prisma.like.count(),
    prisma.photo.aggregate({
      _sum: {
        fileSize: true,
      },
    }),
  ])

  // Format storage with appropriate unit
  const storageBytes = storageData._sum.fileSize || 0
  let storage: string

  if (storageBytes >= 1024 * 1024 * 1024) {
    // GB
    storage = `${(storageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  } else if (storageBytes >= 1024 * 1024) {
    // MB
    storage = `${(storageBytes / (1024 * 1024)).toFixed(2)} MB`
  } else if (storageBytes >= 1024) {
    // KB
    storage = `${(storageBytes / 1024).toFixed(2)} KB`
  } else {
    // Bytes
    storage = `${storageBytes} B`
  }

  return {
    photos,
    albums,
    likes,
    storage,
  }
})

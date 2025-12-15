import { prisma } from "~~/lib/prisma"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  const body = await readBody(event)

  const photo = await prisma.photo.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      visibility: body.visibility,
      rotation: body.rotation !== undefined ? body.rotation : undefined,
      cameraMake: body.cameraMake !== undefined ? body.cameraMake : undefined,
      cameraModel: body.cameraModel !== undefined ? body.cameraModel : undefined,
      fNumber: body.fNumber !== undefined ? body.fNumber : undefined,
      exposureTime: body.exposureTime !== undefined ? body.exposureTime : undefined,
      iso: body.iso !== undefined ? body.iso : undefined,
      focalLength: body.focalLength !== undefined ? body.focalLength : undefined,
      lensModel: body.lensModel !== undefined ? body.lensModel : undefined,
      tags: body.tags
        ? {
            set: [],
            connectOrCreate: body.tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag, slug: tag.toLowerCase().replace(/\s+/g, "-") },
            })),
          }
        : undefined,
      albums: body.albumIds
        ? {
            set: body.albumIds.map((id: string) => ({ id })),
          }
        : undefined,
    },
    include: {
      tags: true,
      albums: true,
    },
  })

  return photo
})

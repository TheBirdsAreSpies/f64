import { prisma } from "~~/lib/prisma"
import { photoUpdateSchema } from "~~/server/schemas/photo.schema"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, message: "Photo ID is required" })
  }

  const body = await readBody(event)
  const validated = photoUpdateSchema.parse(body)

  const photo = await prisma.photo.update({
    where: { id },
    data: {
      title: validated.title,
      description: validated.description,
      visibility: validated.visibility,
      rotation: validated.rotation,
      cameraMake: validated.cameraMake,
      cameraModel: validated.cameraModel,
      fNumber: validated.fNumber,
      exposureTime: validated.exposureTime,
      iso: validated.iso,
      focalLength: validated.focalLength,
      lensModel: validated.lensModel,
      sortOrder: validated.sortOrder,
      tags: validated.tags
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

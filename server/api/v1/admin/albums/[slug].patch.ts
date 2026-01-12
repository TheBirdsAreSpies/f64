import { prisma } from "~~/lib/prisma"
import { albumUpdateSchema } from "~~/server/schemas/album.schema"
import { hasRole } from "~~/server/utils/hasRole"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const slug = getRouterParam(event, "slug")

  await hasRole(session, "admin")

  if (!slug) {
    throw createError({ statusCode: 400, message: "Album slug is required" })
  }

  const album = await prisma.album.findUnique({
    where: { slug },
  })

  if (!album) {
    throw createError({ statusCode: 404, message: "Album not found" })
  }

  const body = await readBody(event)
  const validated = albumUpdateSchema.parse(body)

  let newSlug = validated.slug
  if (newSlug && newSlug !== album.slug) {
    const baseSlug = newSlug
    let counter = 1
    while (await prisma.album.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${baseSlug}-${counter}`
      counter++
    }
  }

  let hashedPassword = album.password
  if (validated.visibility === "password" && validated.password) {
    hashedPassword = await hashPassword(validated.password)
  } else if (validated.visibility !== "password") {
    hashedPassword = null
  }

  const updatedAlbum = await prisma.album.update({
    where: { slug },
    data: {
      title: validated.title,
      description: validated.description,
      slug: newSlug,
      visibility: validated.visibility,
      password: hashedPassword,
      coverPhotoId: validated.coverPhotoId,
      sortOrder: validated.sortOrder,
      updatedBy: session.user.id,
      tags: validated.tags
        ? {
            set: [],
            connectOrCreate: validated.tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag, slug: tag.toLowerCase().replace(/\s+/g, "-") },
            })),
          }
        : undefined,
    },
    include: {
      tags: true,
      photos: {
        take: 10,
        orderBy: {
          uploadedAt: "desc",
        },
      },
      _count: {
        select: {
          photos: true,
        },
      },
    },
  })

  return updatedAlbum
})

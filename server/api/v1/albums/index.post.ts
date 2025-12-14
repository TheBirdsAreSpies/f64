import { prisma } from "~~/lib/prisma"
import { albumCreateSchema } from "~~/server/schemas/photo.schema"
import { AlbumPermission } from "~~/server/types/permissions"
import { checkPermission } from "~~/server/utils/checkPermission"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await checkPermission(session, AlbumPermission.Create)

  const body = await readBody(event)
  const validated = albumCreateSchema.parse(body)

  // Generate slug from title if not provided
  const baseSlug = validated.slug || validated.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  // Ensure slug is unique by appending a number if needed
  let slug = baseSlug
  let counter = 1
  while (await prisma.album.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  // Hash password if provided
  let hashedPassword = null
  if (validated.visibility === "password" && validated.password) {
    hashedPassword = await hashPassword(validated.password)
  }

  const album = await prisma.album.create({
    data: {
      title: validated.title,
      description: validated.description,
      slug,
      visibility: validated.visibility,
      password: hashedPassword,
      createdBy: session.user.id,
      updatedBy: session.user.id,
      tags: validated.tags
        ? {
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
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return album
})

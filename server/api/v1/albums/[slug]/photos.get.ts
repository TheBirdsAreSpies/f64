import { prisma } from "~~/lib/prisma"

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")
  // check if album is private -> admin role
  // check if album is password protected -> check password header

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Album slug is required",
    })
  }

  // Find album by slug
  const album = await prisma.album.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!album) {
    throw createError({
      statusCode: 404,
      message: "Album not found",
    })
  }

  // Fetch photos in the album
  const photos = await prisma.photo.findMany({
    where: {
      albums: {
        some: {
          id: album.id,
        },
      },
    },
    select: {
      id: true,
      title: true,
      thumbnailPath: true,
      originalPath: true,
      visibility: true,
      rotation: true,
      uploadedAt: true,
      width: true,
      height: true,
      tags: true,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { uploadedAt: "desc" },
    ],
  })

  return photos
})

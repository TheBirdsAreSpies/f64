import { prisma } from "~~/lib/prisma"
import { photoUploadSchema } from "~~/server/schemas/photo.schema"
import { PhotoPermission } from "~~/server/types/permissions"
import { checkPermission } from "~~/server/utils/checkPermission"
import { calculateFileHash, createThumbnail, extractImageMetadata, saveUploadedFile } from "~~/server/utils/fileUpload"

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await checkPermission(session, PhotoPermission.Upload)

  const formData = await readFormData(event)
  const file = formData.get("file") as File

  if (!file) {
    throw createError({ statusCode: 400, message: "No file provided" })
  }

  // Distinguish between image and RAW files
  const rawExtensions = [".cr2", ".cr3", ".nef", ".arw", ".dng", ".raf", ".orf", ".rw2", ".pef", ".srw"]
  const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ""
  const isRawFile = rawExtensions.includes(fileExtension)

  if (!file.type.startsWith("image/") && !isRawFile) {
    throw createError({ statusCode: 400, message: "File must be an image or RAW file" })
  }

  const description = formData.get("description")
  const albumIdsData = formData.get("albumIds")
  const visibility = formData.get("visibility")
  const tagsData = formData.get("tags")
  const takenAt = formData.get("takenAt")

  const metadata = {
    title: formData.get("title") as string,
    description: description && description !== "null" ? description as string : undefined,
    albumIds: albumIdsData ? JSON.parse(albumIdsData as string) : undefined,
    visibility: visibility as string | undefined,
    tags: tagsData ? JSON.parse(tagsData as string) : undefined,
    takenAt: takenAt && takenAt !== "null" ? takenAt as string : undefined,
  }

  const validated = photoUploadSchema.parse(metadata)

  const fileHash = await calculateFileHash(file)
  const existingPhoto = await prisma.photo.findFirst({
    where: { fileHash },
    select: { id: true, title: true, originalPath: true },
  })

  if (existingPhoto) {
    throw createError({ statusCode: 409, message: `This photo has already been uploaded: "${existingPhoto.title}"` })
  }

  const { filename, path: originalPath, size } = await saveUploadedFile(file, "uploads/photos", isRawFile)

  const thumbnailPath = await createThumbnail(originalPath, false)
  const imageMetadata = await extractImageMetadata(file, isRawFile)

  const photo = await prisma.photo.create({
    data: {
      title: validated.title,
      description: validated.description,
      filename,
      originalPath,
      thumbnailPath,
      fileSize: size,
      fileHash,
      mimeType: imageMetadata.mimeType,
      width: imageMetadata.width,
      height: imageMetadata.height,
      colorSpace: imageMetadata.colorSpace,
      cameraMake: imageMetadata.exif?.make,
      cameraModel: imageMetadata.exif?.model,
      exposureTime: imageMetadata.exif?.exposureTime,
      fNumber: imageMetadata.exif?.fNumber,
      iso: imageMetadata.exif?.iso,
      focalLength: imageMetadata.exif?.focalLength,
      lensModel: imageMetadata.exif?.lens,
      exifData: imageMetadata.exif ? JSON.stringify(imageMetadata.exif) : null,
      visibility: validated.visibility,
      uploadedBy: session.user.id,
      takenAt: validated.takenAt ? new Date(validated.takenAt) : null,
      albums: validated.albumIds?.length
        ? {
            connect: validated.albumIds.map(id => ({ id })),
          }
        : undefined,
      tags: validated.tags
        ? {
            connectOrCreate: validated.tags.map(tag => ({
              where: { name: tag },
              create: { name: tag, slug: tag.toLowerCase().replace(/\s+/g, "-") },
            })),
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

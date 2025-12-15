export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  await hasRole(session, "admin")

  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, message: "No file provided" })
  }

  const fileEntry = form.find(entry => entry.name === "file")
  if (!fileEntry || !fileEntry.data) {
    throw createError({ statusCode: 400, message: "No file provided" })
  }

  try {
    // Extract embedded JPEG thumbnail from RAW file
    const dcrawModule = await import("dcraw")
    const dcraw = (dcrawModule.default || dcrawModule) as any

    const thumbnailBuffer = (dcraw as any)(fileEntry.data, { extractThumbnail: true })

    setHeader(event, "Content-Type", "image/jpeg")
    setHeader(event, "Cache-Control", "no-cache")

    await logAction("Extracted thumbnail from RAW file", event.path, session)

    return thumbnailBuffer
  } catch (error) {
    console.error("Failed to extract RAW thumbnail:", error)
    throw createError({ statusCode: 500, message: `Failed to extract thumbnail from RAW file: ${error}` })
  }
})

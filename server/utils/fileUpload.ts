import { Buffer } from "node:buffer"
import crypto from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"
import dcraw from "dcraw"
import exifReader from "exif-reader"
import sharp from "sharp"

export async function calculateFileHash(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return crypto.createHash("sha256").update(buffer).digest("hex")
}

export async function saveUploadedFile(file: File, uploadDir: string = "uploads/photos", isRaw: boolean = false): Promise<{ filename: string, path: string, size: number }> {
  const publicDir = path.join(process.cwd(), "public", uploadDir)

  await fs.mkdir(publicDir, { recursive: true })

  const hash = crypto.randomBytes(16).toString("hex")

  let buffer = Buffer.from(await file.arrayBuffer())
  let ext = path.extname(file.name)

  // For RAW files, extract and save the embedded JPEG instead
  if (isRaw) {
    const jpegBuffer = dcraw(buffer, { extractThumbnail: true })
    buffer = Buffer.from(jpegBuffer)
    ext = ".jpg"
  }

  const filename = `${Date.now()}-${hash}${ext}`
  const filePath = path.join(publicDir, filename)

  await fs.writeFile(filePath, buffer)

  return {
    filename,
    path: `/${uploadDir}/${filename}`,
    size: buffer.length,
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), "public", filePath)
    await fs.unlink(fullPath)
  } catch (error) {
    console.error("Error deleting file:", error)
  }
}

export async function createThumbnail(originalPath: string, isRaw: boolean = false): Promise<string> {
  try {
    const publicDir = path.join(process.cwd(), "public")
    const fullPath = path.join(publicDir, originalPath)

    const thumbnailDir = path.join(publicDir, "uploads/thumbnails")
    await fs.mkdir(thumbnailDir, { recursive: true })

    const ext = path.extname(originalPath)
    const basename = path.basename(originalPath, ext)
    const thumbnailFilename = `${basename}.jpg`
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename)

    if (isRaw) {
      // Extract embedded JPEG from RAW file
      const rawBuffer = await fs.readFile(fullPath)
      const thumbnail = dcraw(rawBuffer, { extractThumbnail: true })

      // Create thumbnail from extracted JPEG
      await sharp(thumbnail)
        .resize(300, 300, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toFile(thumbnailPath)
    } else {
      // Standard image thumbnail
      await sharp(fullPath)
        .resize(300, 300, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toFile(thumbnailPath)
    }

    return `/uploads/thumbnails/${thumbnailFilename}`
  } catch (error) {
    console.error("Error creating thumbnail:", error)
    return originalPath
  }
}

export async function extractImageMetadata(file: File, isRaw: boolean = false): Promise<{
  width?: number
  height?: number
  mimeType: string
  colorSpace?: string
  exif?: {
    make?: string
    model?: string
    exposureTime?: number
    fNumber?: number
    iso?: number
    focalLength?: number
    lens?: string
    dateTime?: string
  }
}> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    // For RAW files, extract EXIF from embedded thumbnail
    if (isRaw) {
      try {
        const thumbnail = dcraw(buffer, { extractThumbnail: true })
        const thumbMetadata = await sharp(thumbnail).metadata()

        const mdResult = dcraw(buffer, { verbose: true, identify: true })
        const mdString = typeof mdResult === "string" ? mdResult : mdResult.toString()
        const md = mdString.split("\n").filter(String)
        const fullSizeLine = md.find((l: string) => l.includes("Full size:"))
        const sizeMatch = fullSizeLine?.match(/(\d+) x (\d+)/)

        let width: number | undefined
        let height: number | undefined
        if (sizeMatch) {
          width = Number.parseInt(sizeMatch[1])
          height = Number.parseInt(sizeMatch[2])
        }

        // Extract EXIF from thumbnail
        let exifData
        if (thumbMetadata.exif) {
          const parsedExif = exifReader(thumbMetadata.exif)
          const isoValue = parsedExif.Photo?.ISOSpeedRatings || parsedExif.Photo?.ISO

          // Helper function to evaluate rational values
          const evalRational = (val: number | [number, number] | undefined): number | undefined => {
            if (typeof val === "number")
              return val
            if (Array.isArray(val) && val.length === 2)
              return (val as [number, number])[0] / (val as [number, number])[1]
            return undefined
          }

          // Round f-number to 1 decimal (5.656854 -> 5.6)
          let fNumber = evalRational(parsedExif.Photo?.FNumber)
          if (fNumber)
            fNumber = Math.round(fNumber * 10) / 10

          // Round exposure time to standard values
          let exposureTime = evalRational(parsedExif.Photo?.ExposureTime)
          if (exposureTime) {
            // Standard shutter speeds (in seconds): 30, 15, 8, 4, 2, 1, 1/2, 1/4, 1/8, 1/15, 1/30, 1/60, 1/125, 1/250, etc.
            const standards = [30, 15, 8, 4, 2, 1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 8, 1 / 10, 1 / 13, 1 / 15, 1 / 20, 1 / 25, 1 / 30, 1 / 40, 1 / 50, 1 / 60, 1 / 80, 1 / 100, 1 / 125, 1 / 160, 1 / 200, 1 / 250, 1 / 320, 1 / 400, 1 / 500, 1 / 640, 1 / 800, 1 / 1000, 1 / 1250, 1 / 1600, 1 / 2000, 1 / 2500, 1 / 3200, 1 / 4000, 1 / 5000, 1 / 6400, 1 / 8000]
            const nearest = standards.reduce((prev, curr) =>
              Math.abs(curr - exposureTime!) < Math.abs(prev - exposureTime!) ? curr : prev,
            )
            exposureTime = nearest
          }

          // Round focal length to 1 decimal
          let focalLength = evalRational(parsedExif.Photo?.FocalLength)
          if (focalLength)
            focalLength = Math.round(focalLength * 10) / 10

          exifData = {
            make: parsedExif.Image?.Make || undefined,
            model: parsedExif.Image?.Model || undefined,
            exposureTime,
            fNumber,
            iso: typeof isoValue === "number" ? isoValue : undefined,
            focalLength,
            lens: parsedExif.Photo?.LensModel || undefined,
            dateTime: parsedExif.Image?.DateTime ? parsedExif.Image.DateTime.toString() : undefined,
          }
        }

        return {
          width,
          height,
          mimeType: file.type || "application/octet-stream",
          exif: exifData,
        }
      } catch (error) {
        console.error("Failed to extract RAW metadata:", error)
        return {
          mimeType: file.type || "application/octet-stream",
        }
      }
    }

    // Regular images
    const imageBuffer: Buffer = buffer
    const metadata = await sharp(imageBuffer).metadata()

    let exifData

    const evalRational = (val: number | [number, number] | undefined): number | undefined => {
      if (typeof val === "number")
        return val
      if (Array.isArray(val) && val.length === 2)
        return (val as [number, number])[0] / (val as [number, number])[1]
      return undefined
    }

    if (metadata.exif) {
      const parsedExif = exifReader(metadata.exif)

      const isoValue = parsedExif.Photo?.ISOSpeedRatings || parsedExif.Photo?.ISO

      exifData = {
        make: parsedExif.Image?.Make || undefined,
        model: parsedExif.Image?.Model || undefined,
        exposureTime: evalRational(parsedExif.Photo?.ExposureTime),
        fNumber: evalRational(parsedExif.Photo?.FNumber),
        iso: typeof isoValue === "number" ? isoValue : undefined,
        focalLength: evalRational(parsedExif.Photo?.FocalLength),
        lens: parsedExif.Photo?.LensModel || undefined,
        dateTime: parsedExif.Image?.DateTime ? parsedExif.Image.DateTime.toString() : undefined,
      }
    } else if (metadata.xmp) {
      // Try to extract from XMP (common in PNG files)
      const xmpString = metadata.xmp.toString()

      const extractXmpValue = (tag: string): string | undefined => {
        const match = xmpString.match(new RegExp(`${tag}="([^"]+)"`))
        return match?.[1]
      }

      const extractXmpNumber = (tag: string): number | undefined => {
        const value = extractXmpValue(tag)
        if (!value)
          return undefined

        // Handle rational numbers like "63/10" or "1/800"
        if (value.includes("/")) {
          const [numerator, denominator] = value.split("/").map(Number)
          return denominator ? numerator / denominator : undefined
        }

        return Number.parseFloat(value)
      }

      const exposureTimeXmp = extractXmpNumber("exif:ExposureTime")
      const fNumberXmp = extractXmpNumber("exif:FNumber")
      const focalLengthXmp = extractXmpNumber("exif:FocalLength")

      exifData = {
        make: extractXmpValue("tiff:Make"),
        model: extractXmpValue("tiff:Model"),
        exposureTime: exposureTimeXmp,
        fNumber: fNumberXmp,
        iso: extractXmpNumber("exif:ISOSpeedRatings"),
        focalLength: focalLengthXmp,
        lens: extractXmpValue("aux:Lens") || extractXmpValue("exifEX:LensModel"),
        dateTime: extractXmpValue("xmp:CreateDate") || extractXmpValue("exif:DateTimeOriginal"),
      }
    }

    return {
      width: metadata.width,
      height: metadata.height,
      mimeType: file.type,
      colorSpace: metadata.space,
      exif: exifData,
    }
  } catch (error) {
    console.error("Error extracting metadata:", error)
    return {
      mimeType: file.type,
    }
  }
}

import { Buffer } from "node:buffer"
import crypto from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"
import exifReader from "exif-reader"
import sharp from "sharp"

export async function saveUploadedFile(file: File, uploadDir: string = "uploads/photos"): Promise<{ filename: string, path: string, size: number }> {
  const publicDir = path.join(process.cwd(), "public", uploadDir)

  await fs.mkdir(publicDir, { recursive: true })

  const ext = path.extname(file.name)
  const hash = crypto.randomBytes(16).toString("hex")
  const filename = `${Date.now()}-${hash}${ext}`
  const filePath = path.join(publicDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
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

export async function createThumbnail(originalPath: string): Promise<string> {
  try {
    const publicDir = path.join(process.cwd(), "public")
    const fullPath = path.join(publicDir, originalPath)

    const thumbnailDir = path.join(publicDir, "uploads/thumbnails")
    await fs.mkdir(thumbnailDir, { recursive: true })

    const ext = path.extname(originalPath)
    const basename = path.basename(originalPath, ext)
    const thumbnailFilename = `${basename}${ext}`
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename)

    await sharp(fullPath)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath)

    return `/uploads/thumbnails/${thumbnailFilename}`
  } catch (error) {
    console.error("Error creating thumbnail:", error)
    return originalPath
  }
}

export async function extractImageMetadata(file: File): Promise<{
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
    const metadata = await sharp(buffer).metadata()

    let exifData

    // Helper function to evaluate rational values (e.g., "1/100" -> 0.01)
    const evalRational = (val: number | number[] | undefined): number | undefined => {
      if (typeof val === "number")
        return val
      if (Array.isArray(val) && val.length === 2)
        return val[0] / val[1]
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
        return value ? Number.parseFloat(value) : undefined
      }

      exifData = {
        make: extractXmpValue("tiff:Make"),
        model: extractXmpValue("tiff:Model"),
        exposureTime: extractXmpNumber("exif:ExposureTime"),
        fNumber: extractXmpNumber("exif:FNumber"),
        iso: extractXmpNumber("exif:ISOSpeedRatings"),
        focalLength: extractXmpNumber("exif:FocalLength"),
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

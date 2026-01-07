import { z } from "zod"

export const photoUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  albumIds: z.array(z.string()).optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  tags: z.array(z.string()).optional(),
  takenAt: z.string().optional(),
})

export const photoUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  albumIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  takenAt: z.string().optional(),
  sortOrder: z.number().optional(),
  rotation: z.number().int().min(0).max(360).optional(),
  cameraMake: z.string().nullable().optional(),
  cameraModel: z.string().nullable().optional(),
  fNumber: z.number().nullable().optional(),
  exposureTime: z.number().nullable().optional(),
  iso: z.number().int().nullable().optional(),
  focalLength: z.number().nullable().optional(),
  lensModel: z.string().nullable().optional(),
})

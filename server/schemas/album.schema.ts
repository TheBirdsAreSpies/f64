import { z } from "zod"

export const albumCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  visibility: z.enum(["public", "private", "password"]).default("public"),
  password: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const albumUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).optional(),
  visibility: z.enum(["public", "private", "password"]).optional(),
  password: z.string().optional().nullable(),
  coverPhotoId: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
})

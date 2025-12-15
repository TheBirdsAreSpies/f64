import { z } from "zod"

export const tagCreateSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  slug: z.string().min(1, "Slug is required"),
  color: z.string().optional(),
})

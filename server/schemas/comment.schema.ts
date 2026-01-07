import { z } from "zod"

export const commentCreateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  photoId: z.string(),
})

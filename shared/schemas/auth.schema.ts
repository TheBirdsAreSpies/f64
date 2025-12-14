import type { Composer } from "vue-i18n"
import * as z from "zod"

export function createStandardLoginSchema(t: Composer["t"]): z.ZodSchema<StandardLoginInput> {
  return z.object({
    email: z
      .string()
      .email(t("login_validation_invalid_email")),
    password: z
      .string()
      .min(4, t("login_validation_min_length", { count: 4 })),
  })
}

export interface StandardLoginInput {
  email: string
  password: string
}

import { prisma } from "~~/lib/prisma"
import { loginSchema } from "~~/server/schemas/auth.schema"

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)

  const user = await prisma.user.findFirst({
    where: { email: body.email },
  })

  if (!user || !user.password) {
    await logAction(`Login attempt with invalid email ${body.email} or password`, event.path, undefined, "warn")
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }

  const result = await verifyPassword(user.password, body.password)
  if (!result) {
    await logAction(`Login attempt with invalid email ${body.email} or password`, event.path, undefined, "warn")
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    lastLoggedIn: new Date(),
  })

  await logAction(`User ${user.email} logged in`, event.path, undefined, "info")

  return { success: true }
})

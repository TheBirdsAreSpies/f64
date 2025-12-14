import type { SecureSessionData, UserSessionRequired } from "#auth-utils"
import type { H3Event } from "h3"
import { prisma } from "~~/lib/prisma"

export async function requireAuth(event: H3Event): Promise<UserSessionRequired & Partial<SecureSessionData>> {
  try {
    const session = await requireUserSession(event)

    if (session) {
      return session
    }
  } catch {
    // no user session, move on to check if there is api key
    // await logAction("No user found in session - check for api key", event.path, undefined, "warn")
  }

  // check for api key
  const authHeader = getHeader(event, "authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring("Bearer ".length).trim()

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: token },
      include: { user: true },
    })

    if (apiKey && apiKey.isActive && (!apiKey.validTo || new Date(apiKey.validTo) > new Date())) {
      if (!apiKey.user) {
        await logAction("Invalid API Key", event.path, undefined, "warn")
        throw createError({ statusCode: 401, statusMessage: "Invalid API Key" })
      }

      const secureData: SecureSessionData = {
        apiKey: apiKey.key,
      }

      return {
        id: apiKey.user.id,
        user: apiKey.user,
        lastLoggedIn: new Date(),
        ...secureData,
      }
    }
  }

  await logAction("No valid API Key found", event.path, undefined, "warn")
  throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
}

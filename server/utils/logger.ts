import type { SecureSessionData, UserSessionRequired } from "#auth-utils"
import type { Log, LogRequestType } from "~~/generated/prisma/client"
import { prisma } from "~~/lib/prisma"

export async function logAction(
  message: string,
  endpoint: string,
  session: UserSessionRequired & Partial<SecureSessionData> | undefined,
  level: "info" | "warn" | "error" = "info",
  error?: any,
): Promise<Log | undefined> {
  if (!level) {
    level = "info"
  }

  const logLevel = await prisma.logLevel.findUnique({
    where: { name: level },
  })

  if (!logLevel) {
    throw new Error(`LogLevel "${level}" not found`)
  }

  let requestType: string
  if (session) {
    if (session.apiKey) {
      requestType = "API"
    } else {
      requestType = "Application"
    }
  } else {
    requestType = "undefined"
  }

  const logType: LogRequestType | null = await prisma.logRequestType.findUnique({
    where: { name: requestType },
  })

  try {
    const log = await prisma.log.create({
      data: {
        message,
        endpoint,
        userId: session?.user?.id,
        logLevelId: logLevel.id,
        logRequestTypeId: logType!.id,
        error: error ? JSON.stringify(error.message) : undefined,
      },
      include: {
        user: true,
        logLevel: true,
        logRequestType: true,
      },
    })

    return log
  } catch {
    return undefined
  }
}

import type { User } from "~~/shared/types/user"

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()

  if (!user.value) {
    await fetch()
  }

  if (!loggedIn.value) {
    return navigateTo({
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    })
  }

  try {
    const userData = await $fetch<User>("/api/v1/me", {
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    })

    if (!userData || !userData.roles || userData.roles.length === 0) {
      return navigateTo("/")
    }

    const hasAdminRole = userData.roles.some(
      role => role.name === "admin",
    )

    if (!hasAdminRole) {
      return navigateTo("/")
    }
  } catch (error: any) {
    if (error?.statusCode === 401 || error?.status === 401) {
      return navigateTo({
        path: "/login",
        query: {
          redirect: to.fullPath,
        },
      })
    }
    return navigateTo("/")
  }
})

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const { loggedIn, user, fetch } = useUserSession()

  if (!user.value) {
    await fetch()
  }

  if (!loggedIn.value) {
    return navigateTo({
      path: localePath("/login"),
      query: {
        redirect: to.fullPath,
      },
    })
  }

  // TODO: Check email verification for non-admin routes
  // if (user.value && !(user.value as any).emailVerified && !to.path.startsWith("/verify")) {
  //   return navigateTo("/verify-email-required")
  // }
})

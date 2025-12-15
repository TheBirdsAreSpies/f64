export default defineNuxtRouteMiddleware(async () => {
  const localePath = useLocalePath()
  const { loggedIn } = useUserSession()

  if (loggedIn.value) {
    return navigateTo(localePath("/"))
  }
})

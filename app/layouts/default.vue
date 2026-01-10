<template>
  <div class="flex flex-col min-h-screen">
    <UHeader :to="localePath('/')">
      <template #title>
        <div class="flex items-center gap-3">
          <AppLogo />
          <span class="text-2xl font-bold">ƒ/64</span>
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UDropdownMenu :items="languageMenuItems">
            <UButton
              color="neutral"
              variant="ghost"
              :label="currentLanguageLabel"
              :leading-icon="currentLanguageIcon"
              trailing-icon="lucide:chevron-down"
            />
          </UDropdownMenu>

          <AuthState>
            <template #default="{ user }">
              <UDropdownMenu
                v-if="user"
                :items="getDropdownItems(user)"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  :label="`${user.firstName} ${user.lastName}`"
                  trailing-icon="lucide:chevron-down"
                />
              </UDropdownMenu>
              <div
                v-else
                class="flex gap-2"
              >
                <UButton
                  :to="localePath('/login')"
                  color="neutral"
                  variant="ghost"
                >
                  {{ t('nav_login') }}
                </UButton>
                <UButton :to="localePath('/register')">
                  {{ t('nav_register') }}
                </UButton>
              </div>
            </template>
          </AuthState>
        </div>
      </template>
    </UHeader>

    <!-- Page Content -->
    <div class="flex-1 container mx-auto px-4 py-6">
      <slot />
    </div>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
          <p>{{ t('footer_copyright') }}</p>
          <p>{{ appVersion }} — {{ t('footer_built', { time: formattedBuildTime }) }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t, d, locale, setLocale } = useI18n()

const appVersion = import.meta.env.APP_VERSION || "v1.0.0"
const buildTimeISO = import.meta.env.BUILD_TIME || new Date().toISOString()
const formattedBuildTime = computed(() => {
  try {
    return d(new Date(buildTimeISO), { dateStyle: "long", timeStyle: "short" })
  } catch {
    return buildTimeISO
  }
})

const roles = ref<string[] | null>(null)
const session = useUserSession()

watch(
  () => session.user,
  async (u) => {
    if (!u) {
      roles.value = null
      return
    }
    try {
      const res = await $fetch("/api/v1/me/permissions")
      roles.value = Array.isArray(res?.roles) ? res.roles : []
    } catch {
      roles.value = []
    }
  },
  { immediate: true },
)

function getDropdownItems(_user: any) {
  const items: any[] = []

  const isAdmin = !!roles.value?.includes("admin")
  if (isAdmin) {
    items.push([{ label: t("nav_admin"), to: localePath("/admin"), icon: "lucide:settings" }])
  }

  items.push([
    {
      label: t("nav_logout"),
      icon: "lucide:log-out",
      onSelect: async () => {
        await session.clear()
        await navigateTo(localePath("/"))
      },
    },
  ])

  return items
}

const currentLanguageLabel = computed(() => {
  switch (locale.value) {
    case "de":
      return t("lang_german")
    default:
      return t("lang_english")
  }
})

const languageMenuItems = computed(() => [
  [
    { label: t("lang_english"), icon: "circle-flags:gb", onSelect: () => setLocale("en") },
    { label: t("lang_german"), icon: "circle-flags:de", onSelect: () => setLocale("de") },
  ],
])

const currentLanguageIcon = computed(() => {
  switch (locale.value) {
    case "de":
      return "circle-flags:de"
    default:
      return "circle-flags:gb"
  }
})
</script>

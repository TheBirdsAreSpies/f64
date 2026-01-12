<template>
  <div class="flex flex-col min-h-dvh overflow-x-hidden">
    <UHeader :to="localePath('/')">
      <template #title>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="localePath('/')"
            class="flex items-center gap-1.5 sm:gap-3"
          >
            <AppLogo class="w-6 h-6 sm:w-8 sm:h-8" />
            <span class="text-lg sm:text-2xl font-bold">ƒ/64</span>
          </NuxtLink>
          <div class="hidden lg:block h-6 w-px bg-gray-200 dark:bg-gray-800" />
          <UDropdownMenu
            v-if="publicAlbums.length"
            :items="albumMenuItems"
            class="hidden lg:block"
          >
            <UButton
              color="neutral"
              variant="ghost"
              trailing-icon="lucide:chevron-down"
            >
              {{ t('nav_albums') }}
            </UButton>
          </UDropdownMenu>
          <UButton
            v-else
            :to="localePath('/albums')"
            color="neutral"
            variant="ghost"
            class="hidden lg:flex"
          >
            {{ t('nav_albums') }}
          </UButton>
        </div>
      </template>
      <template #right>
        <LanguageSelector class="hidden mr-3 md:block" />
        <AuthState>
          <template #default="{ user }">
            <UDropdownMenu
              v-if="user"
              :items="dropdownItems"
            >
              <UButton
                color="neutral"
                variant="ghost"
                :label="`${user.firstName} ${user.lastName}`"
                trailing-icon="lucide:chevron-down"
                class="hidden md:flex"
              />
            </UDropdownMenu>
            <div
              v-else
              class="hidden md:flex gap-2"
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
      </template>

      <template #body>
        <div class="flex flex-col gap-4">
          <div
            v-if="publicAlbums.length"
            class="flex flex-col gap-2"
          >
            <div class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {{ t('nav_albums') }}
            </div>
            <div class="flex flex-col gap-1">
              <UButton
                v-for="album in publicAlbums"
                :key="album.id"
                :to="localePath(`/albums/${album.slug}`)"
                color="neutral"
                variant="ghost"
                size="sm"
                block
              >
                {{ album.title }}
              </UButton>
            </div>
          </div>

          <LanguageSelector class="md:hidden" />

          <AuthState>
            <template #default="{ user }">
              <div
                v-if="user"
                class="flex flex-col gap-3"
              >
                <div class="text-sm font-medium border-b pb-2">
                  {{ user.firstName }} {{ user.lastName }}
                </div>
                <UButton
                  v-if="hasRole('admin')"
                  :to="localePath('/admin')"
                  icon="lucide:settings"
                  color="neutral"
                  variant="ghost"
                  block
                >
                  {{ t('nav_admin') }}
                </UButton>
                <UButton
                  icon="lucide:log-out"
                  color="neutral"
                  variant="ghost"
                  block
                  @click="handleLogout"
                >
                  {{ t('nav_logout') }}
                </UButton>
              </div>
              <div
                v-else
                class="flex flex-col gap-3"
              >
                <UButton
                  :to="localePath('/login')"
                  color="neutral"
                  variant="ghost"
                  block
                >
                  {{ t('nav_login') }}
                </UButton>
                <UButton
                  :to="localePath('/register')"
                  block
                >
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
    <footer class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto pb-[env(safe-area-inset-bottom)] w-full pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div class="container mx-auto px-4 py-4 sm:py-6 max-w-full">
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center w-full max-w-3xl mx-auto">
          <p class="whitespace-normal wrap-break-word leading-snug px-3 sm:px-2 lg:px-3">
            {{ t('footer_copyright') }}
          </p>
          <p class="whitespace-normal wrap-break-word leading-snug px-3 sm:px-2 lg:px-3">
            {{ appVersion }} — {{ t('footer_built', { time: formattedBuildTime }) }}
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t, d } = useI18n()

const albumsStore = useAlbumsStore()

const { data: albumsData } = await useFetch("/api/v1/albums", {
  query: { limit: 100 },
})

// Sync fetched data to store
if (albumsData.value?.albums) {
  albumsStore.albums = albumsData.value.albums.map(album => ({
    ...album,
    createdAt: new Date(album.createdAt),
    updatedAt: new Date(album.updatedAt),
  })).sort((a, b) => a.title.localeCompare(b.title))
}

const publicAlbums = computed(() => {
  return albumsStore.albums.filter(album => album.visibility !== "private")
})

const albumMenuItems = computed(() => {
  if (!publicAlbums.value.length)
    return []

  return [publicAlbums.value.map(album => ({
    label: album.title,
    to: localePath(`/albums/${album.slug}`),
  }))]
})

const appVersion = import.meta.env.APP_VERSION || "v1.0.0"
const buildTimeISO = import.meta.env.BUILD_TIME || new Date().toISOString()
const formattedBuildTime = computed(() => {
  try {
    return d(new Date(buildTimeISO), { dateStyle: "long", timeStyle: "short" })
  } catch {
    return buildTimeISO
  }
})

const session = useUserSession()
const sessionUser = computed(() => session.user.value)
const { fetchPermissions, clearPermissions, hasRole } = usePermissions()

async function syncPermissions() {
  if (!sessionUser.value) {
    clearPermissions()
    return
  }

  try {
    await fetchPermissions(true)
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status
    if (status === 401) {
      await session.clear()
    }
    clearPermissions()
  }
}

watch(
  () => sessionUser.value?.id,
  async () => {
    await syncPermissions()
  },
  { immediate: true },
)

async function handleLogout() {
  await session.clear()
  clearPermissions()
  await navigateTo(localePath("/"))
}

const dropdownItems = computed(() => {
  const items: any[] = []

  if (hasRole("admin")) {
    items.push([{ label: t("nav_admin"), to: localePath("/admin"), icon: "lucide:settings" }])
  }

  items.push([
    {
      label: t("nav_logout"),
      icon: "lucide:log-out",
      onSelect: async () => {
        await handleLogout()
      },
    },
  ])

  return items
})
</script>

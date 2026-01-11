<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col lg:flex-row">
    <!-- Mobile Header -->
    <div class="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <NuxtLink
        :to="localePath('/admin')"
        class="flex items-center gap-2"
      >
        <AppLogo class="w-6 h-6" />
        <span class="text-lg font-bold text-gray-900 dark:text-white">ƒ/64</span>
      </NuxtLink>
      <UButton
        icon="lucide:menu"
        color="neutral"
        variant="ghost"
        @click="sidebarOpen = !sidebarOpen"
      />
    </div>

    <!-- Left Sidebar -->
    <aside
      class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 lg:h-screen lg:sticky lg:top-0"
      :class="sidebarOpen ? 'fixed inset-0 z-40' : 'hidden lg:flex'"
    >
      <!-- Logo (Desktop only) -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-800 hidden lg:block">
        <NuxtLink
          :to="localePath('/admin')"
          class="flex items-center gap-3"
        >
          <AppLogo />
          <span class="text-2xl font-bold text-gray-900 dark:text-white">ƒ/64</span>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <UButton
          :to="localePath('/admin')"
          :color="isActive('/admin') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:layout-dashboard"
          :label="t('nav_dashboard')"
          block
          class="justify-start"
        />

        <!-- Library Section -->
        <div class="pt-4 pb-2 px-3">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('nav_library_section') }}
          </p>
        </div>
        <UButton
          :to="localePath('/admin/photos')"
          :color="isActive('/admin/photos') && !route.query.filter ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:image"
          :label="t('nav_library')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/albums')"
          :color="isActive('/admin/albums') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:folder"
          :label="t('nav_albums')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/tags')"
          :color="isActive('/admin/tags') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:tags"
          :label="t('nav_tags')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/trash')"
          :color="isActive('/admin/trash') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:trash-2"
          :label="t('nav_trash')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/photos?filter=favorites')"
          :color="isFilterActive('favorites') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:star"
          :label="t('nav_favorites')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/photos?filter=featured')"
          :color="isFilterActive('featured') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:award"
          :label="t('nav_featured')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/photos?filter=unlisted')"
          :color="isFilterActive('unlisted') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:eye-off"
          :label="t('nav_unlisted')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/photos?filter=private')"
          :color="isFilterActive('private') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:lock"
          :label="t('nav_private')"
          block
          class="justify-start"
        />
        <!-- Albums List -->
        <div class="pt-4 pb-2 px-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {{ t('nav_albums_section') }}
            </p>
            <UButton
              :to="localePath('/admin/albums/new')"
              icon="lucide:plus"
              size="xs"
              color="neutral"
              variant="ghost"
            />
          </div>
        </div>
        <div
          v-if="albumsStore.albums?.length"
          class="space-y-1 max-h-48 overflow-y-auto px-2"
        >
          <UButton
            v-for="album in albumsStore.albums.slice(0, 10)"
            :key="album.id"
            :to="localePath(`/admin/albums/${album.slug}`)"
            variant="ghost"
            color="neutral"
            size="xs"
            class="w-full justify-start text-xs"
            block
          >
            <div class="flex items-center gap-2 w-full truncate">
              <UIcon
                name="lucide:folder"
                class="text-purple-600 dark:text-purple-400 shrink-0 text-xs"
              />
              <span class="truncate">{{ album.title }}</span>
            </div>
          </UButton>
        </div>
        <div
          v-else
          class="px-2 py-4 text-center"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('nav_albums_empty') }}
          </p>
        </div>

        <!-- Tags List -->
        <div class="pt-4 pb-2 px-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {{ t('nav_tags_section') }}
            </p>
          </div>
        </div>
        <div
          v-if="tags?.tags?.length"
          class="px-2 pb-2"
        >
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="tag in tags.tags.slice(0, 15)"
              :key="tag.id"
              color="neutral"
              variant="outline"
              size="xs"
            >
              {{ tag.name }}
            </UBadge>
          </div>
        </div>
        <div
          v-else
          class="px-2 py-4 text-center"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('nav_tags_empty') }}
          </p>
        </div>

        <!-- Years Section -->
        <div class="pt-4 pb-2 px-3">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('nav_years_section') }}
          </p>
        </div>
        <div
          v-if="years?.length"
          class="space-y-1 max-h-48 overflow-y-auto px-2"
        >
          <UButton
            v-for="year in years"
            :key="year.year"
            :to="localePath(`/admin/photos?year=${year.year}`)"
            variant="ghost"
            color="neutral"
            size="xs"
            class="w-full justify-between text-xs"
            block
          >
            <span>{{ year.year }}</span>
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
            >
              {{ year.count }}
            </UBadge>
          </UButton>
        </div>
        <div
          v-else
          class="px-2 py-4 text-center"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('nav_albums_empty') }}
          </p>
        </div>

        <div class="pt-4 pb-2 px-3">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('nav_settings') }}
          </p>
        </div>

        <UButton
          :to="localePath('/admin/themes')"
          :color="isActive('/admin/themes') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:palette"
          :label="t('nav_themes')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/settings')"
          :color="isActive('/admin/settings') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:settings"
          :label="t('nav_site_settings')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/users')"
          :color="isActive('/admin/users') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:users"
          :label="t('nav_users')"
          block
          class="justify-start"
        />

        <div class="pt-4 pb-2 px-3">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('nav_tools') }}
          </p>
        </div>

        <UButton
          :to="localePath('/admin/photos?filter=last-import')"
          :color="isFilterActive('last-import') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:clock"
          :label="t('nav_last_import')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/import')"
          :color="isActive('/admin/import') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:upload"
          :label="t('nav_import')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/export')"
          :color="isActive('/admin/export') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:download"
          :label="t('nav_export')"
          block
          class="justify-start"
        />
        <UButton
          :to="localePath('/admin/plugins')"
          :color="isActive('/admin/plugins') ? 'primary' : 'neutral'"
          variant="ghost"
          icon="lucide:puzzle"
          :label="t('nav_plugins')"
          block
          class="justify-start"
        />
      </nav>

      <!-- Bottom Actions -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <LanguageSelector />

        <UButton
          :to="localePath('/')"
          color="neutral"
          variant="ghost"
          icon="lucide:external-link"
          :label="t('nav_view_site')"
          block
          class="justify-start"
        />

        <AuthState>
          <template #default="{ user, clear }">
            <UDropdownMenu
              :items="[
                [
                  { label: t('nav_profile'), icon: 'lucide:user', to: localePath('/admin/profile') },
                  { label: t('nav_my_account'), icon: 'lucide:user-cog', to: localePath('/admin/account') },
                ],
                [{ label: t('nav_logout'), icon: 'lucide:log-out', click: clear }],
              ]"
            >
              <UButton
                color="neutral"
                variant="ghost"
                icon="lucide:circle-user"
                :label="`${user?.firstName} ${user?.lastName}`"
                trailing-icon="lucide:chevron-down"
                block
                class="justify-start"
              />
            </UDropdownMenu>
          </template>
        </AuthState>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto w-full lg:w-auto">
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <slot />
      </div>
    </main>

    <!-- Mobile Overlay -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="sidebarOpen"
          class="lg:hidden fixed inset-0 bg-black/0 z-30"
          @click="sidebarOpen = false"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useAlbumsStore } from "~/stores/albums"

interface Tag {
  id: string
  name: string
  slug: string
  color: string | null
  createdAt: string
  _count: {
    photos: number
  }
}

interface TagsResponse {
  tags: Tag[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface YearStat {
  year: number
  count: number
}

const sidebarOpen = ref(false)
const albumsStore = useAlbumsStore()
await albumsStore.fetchAlbums(10)

const { data: tags } = await useFetch<TagsResponse>("/api/v1/tags", { query: { limit: 15 } })
const { data: years } = await useFetch<YearStat[]>("/api/v1/admin/photos/years")

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// Close sidebar when route changes
watch(() => route.path, () => {
  sidebarOpen.value = false
})

function isActive(path: string) {
  const currentPath = route.path.replace(/^\/(en|de)/, "") // Remove locale prefix
  const targetPath = path.replace(/^\/(en|de)/, "")

  if (targetPath === "/admin" && (currentPath === "/admin" || currentPath === "" || currentPath === "/"))
    return true
  if (targetPath !== "/admin" && currentPath.startsWith(targetPath))
    return true

  return false
}

function isFilterActive(filter: string) {
  return route.query.filter === filter
}
</script>

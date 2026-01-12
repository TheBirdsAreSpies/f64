<template>
  <div class="space-y-6">
    <UPageHeader
      :title="t('admin_albums_title')"
      :description="t('admin_albums_description')"
    >
      <template #links>
        <UButton
          :to="localePath('/admin/albums/new')"
          icon="lucide:plus"
          :label="t('admin_albums_create')"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <!-- Search and Filters -->
      <div class="space-y-4 mb-6">
        <UInput
          v-model="search"
          :placeholder="t('admin_albums_search_placeholder')"
          icon="lucide:search"
          size="lg"
        />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Visibility Filter -->
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {{ t('admin_albums_field_visibility') }}
            </label>
            <USelectMenu
              v-model="selectedVisibility"
              :items="visibilityFilterOptions"
              value-key="value"
              multiple
              :placeholder="t('admin_albums_filter_visibility_placeholder')"
            />
          </div>

          <!-- Tags Filter -->
          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {{ t('admin_albums_field_tags') }}
            </label>
            <USelectMenu
              v-model="selectedTags"
              :items="tagsOptions"
              value-key="value"
              multiple
              searchable
              :placeholder="t('admin_albums_filter_tags_placeholder')"
            />
          </div>
        </div>
      </div>

      <!-- Albums Grid -->
      <div
        v-if="albumsData?.albums?.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <UCard
          v-for="album in albumsData.albums"
          :key="album.id"
          class="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer"
          @click="navigateTo(localePath(`/admin/albums/${album.slug}`))"
        >
          <template #header>
            <div class="aspect-video bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
              <NuxtImg
                v-if="album.coverPhoto?.thumbnailPath"
                :src="album.coverPhoto.thumbnailPath"
                :alt="album.title"
                class="w-full h-full object-cover"
                :style="album.coverPhoto.rotation ? { transform: `rotate(${album.coverPhoto.rotation}deg)` } : {}"
                loading="lazy"
              />
              <NuxtImg
                v-else-if="album.photos?.[0]?.thumbnailPath"
                :src="album.photos[0].thumbnailPath"
                :alt="album.title"
                class="w-full h-full object-cover"
                :style="album.photos[0].rotation ? { transform: `rotate(${album.photos[0].rotation}deg)` } : {}"
                loading="lazy"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <UIcon
                  name="lucide:image"
                  class="text-gray-400 text-4xl"
                />
              </div>
            </div>
          </template>

          <div class="space-y-3">
            <div>
              <h3 class="font-semibold text-lg text-gray-900 dark:text-white truncate">
                {{ album.title }}
              </h3>
              <p
                v-if="album.description"
                class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1"
              >
                {{ album.description }}
              </p>
            </div>

            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <UIcon name="lucide:image" />
                <span>{{ album._count?.photos || 0 }} {{ t('admin_albums_photos') }}</span>
              </div>
              <UBadge
                :color="album.visibility === 'public' ? 'success' : album.visibility === 'password' ? 'warning' : 'error'"
                size="sm"
                variant="subtle"
              >
                {{ getVisibilityLabel(album.visibility) }}
              </UBadge>
            </div>

            <div
              v-if="album.tags?.length"
              class="flex flex-wrap gap-1"
            >
              <UBadge
                v-for="tag in album.tags.slice(0, 3)"
                :key="tag.id"
                color="neutral"
                variant="outline"
                size="xs"
              >
                {{ tag.name }}
              </UBadge>
              <UBadge
                v-if="album.tags.length > 3"
                color="neutral"
                variant="outline"
                size="xs"
              >
                +{{ album.tags.length - 3 }}
              </UBadge>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              icon="lucide:trash-2"
              :label="t('admin_albums_delete')"
              @click.stop="confirmDelete(album)"
            />
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!pending"
        class="text-center py-12"
      >
        <UIcon
          name="lucide:folder-x"
          class="text-gray-400 text-6xl mb-4"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ t('admin_albums_empty_title') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ t('admin_albums_empty_description') }}
        </p>
        <UButton
          :to="localePath('/admin/albums/new')"
          icon="lucide:plus"
          :label="t('admin_albums_create')"
        />
      </div>

      <!-- Loading State -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <UCard
          v-for="i in 6"
          :key="i"
        >
          <template #header>
            <USkeleton class="aspect-video w-full" />
          </template>
          <div class="space-y-3">
            <USkeleton class="h-6 w-3/4" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-2/3" />
          </div>
        </UCard>
      </div>

      <!-- Pagination -->
      <div
        v-if="albumsData && albumsData.pagination.totalPages > 1"
        class="flex justify-center mt-8"
      >
        <UPagination
          v-model="page"
          :total="albumsData.pagination.total"
          :page-count="albumsData.pagination.limit"
        />
      </div>
    </UPageBody>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model:open="showDeleteConfirm"
      :title="t('admin_albums_delete_confirm_title')"
      :message="t('admin_albums_delete_confirm_message', { title: albumToDelete?.title || '' })"
      :confirm-text="t('admin_albums_delete_confirm_button')"
      :cancel-text="t('common_cancel')"
      confirm-color="error"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { Album } from "~~/shared/types/album"

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const toast = useToast()
const albumsStore = useAlbumsStore()

interface AlbumsResponse {
  albums: Album[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const search = ref("")
const page = ref(Number.parseInt(route.query.page as string) || 1)
const selectedVisibility = ref<string[]>([])
const selectedTags = ref<string[]>([])
const albumsData = ref<AlbumsResponse | null>(null)
const pending = ref(false)

const { data: tagsData } = await useFetch("/api/v1/tags", { query: { limit: 1000 } })

const tagsOptions = computed(() => {
  return tagsData.value?.tags?.map(tag => ({ label: tag.name, value: tag.name })) || []
})

const visibilityFilterOptions = computed(() => [
  { label: t("visibility_public"), value: "public" },
  { label: t("visibility_private"), value: "private" },
  { label: t("visibility_password"), value: "password" },
])

async function fetchAlbums() {
  pending.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      limit: 12,
    }

    if (search.value) {
      params.search = search.value
    }

    if (selectedVisibility.value?.length > 0) {
      params.visibility = selectedVisibility.value.join(",")
    }

    if (selectedTags.value?.length > 0) {
      params.tags = selectedTags.value.join(",")
    }

    const response = await $fetch<AlbumsResponse>("/api/v1/albums", { query: params })
    albumsData.value = response
  } catch (error) {
    console.error("Error fetching albums:", error)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchAlbums()
})

let searchTimeout: NodeJS.Timeout | null = null

watch(search, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchAlbums()
  }, 300)
})

watch(page, (newPage) => {
  if (newPage > 1) {
    navigateTo({ query: { page: newPage.toString() } })
  } else {
    navigateTo({ query: {} })
  }
  window.scrollTo({ top: 0, behavior: "smooth" })
  fetchAlbums()
})

watch([selectedVisibility, selectedTags], () => {
  page.value = 1
  fetchAlbums()
})

const showDeleteConfirm = ref(false)
const albumToDelete = ref<Album | null>(null)

function confirmDelete(album: Album) {
  albumToDelete.value = album
  showDeleteConfirm.value = true
}

async function handleDeleteConfirm() {
  if (!albumToDelete.value)
    return

  try {
    await $fetch(`/api/v1/admin/albums/${albumToDelete.value.slug}`, {
      method: "DELETE" as any,
    })

    albumsStore.removeAlbum(albumToDelete.value.id)

    if (albumsData.value) {
      albumsData.value.albums = albumsData.value.albums.filter(
        a => a.id !== albumToDelete.value?.id,
      )
    }

    showDeleteConfirm.value = false
    albumToDelete.value = null

    toast.add({
      title: t("admin_albums_deleted"),
      color: "success",
    })
  } catch (error) {
    console.error("Error deleting album:", error)
    toast.add({
      title: t("admin_albums_delete_failed"),
      color: "error",
    })
  }
}

function getVisibilityLabel(visibility: string | undefined) {
  switch (visibility) {
    case "public":
      return t("visibility_public")
    case "password":
      return t("visibility_password")
    case "private":
      return t("visibility_private")
    default:
      return visibility
  }
}
</script>

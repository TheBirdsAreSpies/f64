<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ t('photos_title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          {{ t('photos_description') }}
        </p>
      </div>
      <UButton
        :to="localePath('/admin/photos/upload')"
        icon="lucide:upload"
        :label="t('photos_upload')"
      />
    </div>

    <!-- Filters -->
    <div class="flex gap-3">
      <UButton
        :variant="!filter ? 'solid' : 'outline'"
        :color="!filter ? 'primary' : 'neutral'"
        :label="t('photos_filter_all')"
        @click="setFilter(null)"
      />
      <UButton
        :variant="filter === 'my-photos' ? 'solid' : 'outline'"
        :color="filter === 'my-photos' ? 'primary' : 'neutral'"
        icon="lucide:user"
        :label="t('photos_filter_my_photos')"
        @click="setFilter('my-photos')"
      />
      <UButton
        :variant="filter === 'favorites' ? 'solid' : 'outline'"
        :color="filter === 'favorites' ? 'primary' : 'neutral'"
        icon="lucide:star"
        :label="t('nav_favorites')"
        @click="setFilter('favorites')"
      />
      <UButton
        :variant="filter === 'featured' ? 'solid' : 'outline'"
        :color="filter === 'featured' ? 'primary' : 'neutral'"
        icon="lucide:award"
        :label="t('nav_featured')"
        @click="setFilter('featured')"
      />
      <UButton
        :variant="filter === 'unlisted' ? 'solid' : 'outline'"
        :color="filter === 'unlisted' ? 'primary' : 'neutral'"
        icon="lucide:eye-off"
        :label="t('nav_unlisted')"
        @click="setFilter('unlisted')"
      />
      <UButton
        :variant="filter === 'private' ? 'solid' : 'outline'"
        :color="filter === 'private' ? 'primary' : 'neutral'"
        icon="lucide:lock"
        :label="t('nav_private')"
        @click="setFilter('private')"
      />
      <UButton
        :variant="filter === 'no-album' ? 'solid' : 'outline'"
        :color="filter === 'no-album' ? 'primary' : 'neutral'"
        icon="lucide:folder-x"
        :label="t('photos_filter_no_album')"
        @click="setFilter('no-album')"
      />
    </div>

    <!-- Photos Grid -->
    <div
      v-if="photos?.photos?.length"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <div
        v-for="photo in photos.photos"
        :key="photo.id"
        class="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
        @click="openPhotoDetails(photo.id)"
      >
        <NuxtImg
          :src="photo.thumbnailPath"
          :alt="photo.title"
          class="w-full h-full object-cover transition-transform"
          :style="photo.rotation ? { transform: `rotate(${photo.rotation}deg)` } : {}"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          <div class="flex justify-between items-start">
            <div class="flex gap-1">
              <UBadge
                v-if="photo.visibility === 'private'"
                color="neutral"
                size="xs"
              >
                <UIcon name="lucide:lock" />
              </UBadge>
              <UBadge
                v-if="photo.visibility === 'unlisted'"
                color="neutral"
                size="xs"
              >
                <UIcon name="lucide:eye-off" />
              </UBadge>
            </div>
          </div>
          <div>
            <p class="text-white font-medium text-sm truncate">
              {{ photo.title }}
            </p>
            <p class="text-white/80 text-xs">
              {{ formatDate(photo.uploadedAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-24"
    >
      <UIcon
        name="lucide:image-off"
        class="text-6xl text-gray-400 dark:text-gray-600 mb-4"
      />
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {{ t('photos_empty_title') }}
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ t('photos_empty_description') }}
      </p>
      <UButton
        :to="localePath('/admin/photos/upload')"
        icon="lucide:upload"
        :label="t('photos_upload')"
      />
    </div>

    <!-- Pagination -->
    <div
      v-if="photos?.pagination && photos.pagination.totalPages > 1"
      class="flex justify-center"
    >
      <UPagination
        v-model:page="page"
        :total="photos.pagination.total"
        :items-per-page="photos.pagination.limit"
      />
    </div>

    <!-- Photo Details Slideover -->
    <USlideover
      v-model:open="isPhotoDetailsOpen"
      :title="t('photo_details_title')"
      :modal="false"
      :dismissible="false"
    >
      <template #body>
        <div
          v-if="selectedPhoto"
          ref="slideoverBodyRef"
          class="space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2"
        >
          <!-- Photo Preview -->
          <div class="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <!-- Thumbnail - shown while original is loading -->
            <NuxtImg
              v-if="previewLoading"
              :src="selectedPhoto.thumbnailPath"
              :alt="selectedPhoto.title"
              class="w-full h-full object-contain blur-sm"
              :style="{ transform: `rotate(${photoRotation}deg)` }"
            />
            <!-- Original - shown after loading -->
            <NuxtImg
              v-show="!previewLoading"
              :src="selectedPhoto.originalPath"
              :alt="selectedPhoto.title"
              class="w-full h-full object-contain"
              :style="{ transform: `rotate(${photoRotation}deg)` }"
              @load="previewLoading = false"
              @error="previewLoading = false"
            />
            <div class="absolute top-2 right-2 flex gap-2">
              <UButton
                icon="lucide:rotate-ccw"
                color="neutral"
                size="sm"
                :aria-label="t('photo_rotate_left')"
                @click="rotatePhoto(-90)"
              />
              <UButton
                icon="lucide:rotate-cw"
                color="neutral"
                size="sm"
                :aria-label="t('photo_rotate_right')"
                @click="rotatePhoto(90)"
              />
            </div>
          </div>
          <UButton
            v-if="selectedPhoto"
            :to="localePath(`/photos/${selectedPhoto.id}`)"
            color="neutral"
            variant="ghost"
            icon="lucide:external-link"
            target="_blank"
            class="w-full"
          >
            {{ t('photo_details_view') }}
          </UButton>

          <!-- Photo Info -->
          <div class="space-y-4">
            <UFormField :label="t('photo_field_title')">
              <UInput
                v-model="photoForm.title"
                class="w-full"
                :placeholder="t('photo_field_title_placeholder')"
              />
            </UFormField>

            <UFormField :label="t('photo_field_description')">
              <UTextarea
                v-model="photoForm.description"
                class="w-full"
                :placeholder="t('photo_field_description_placeholder')"
                :rows="3"
              />
            </UFormField>

            <UFormField :label="t('photo_field_visibility')">
              <USelectMenu
                v-model="photoForm.visibility"
                :items="visibilityOptions"
                class="w-full"
                value-key="value"
              />
            </UFormField>

            <UFormField :label="t('photo_field_tags')">
              <div class="space-y-2">
                <div
                  v-if="photoForm.tags.length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <UBadge
                    v-for="(tag, index) in photoForm.tags"
                    :key="tag"
                    color="primary"
                    variant="subtle"
                  >
                    <span>{{ tag }}</span>
                    <UButton
                      icon="lucide:x"
                      size="xs"
                      color="primary"
                      variant="ghost"
                      :padded="false"
                      @click="removeTag(index)"
                    />
                  </UBadge>
                </div>
                <UInputMenu
                  v-model="tagInput"
                  :items="tagSuggestions"
                  :placeholder="t('photo_field_tags_placeholder')"
                  class="w-full"
                  @keydown.enter.prevent="addTag"
                  @update:model-value="(value) => { if (tagSuggestions.includes(value)) addTag() }"
                />
              </div>
            </UFormField>

            <UFormField :label="t('photo_field_albums')">
              <USelectMenu
                v-model="photoForm.albumIds"
                :items="albumOptions"
                value-key="value"
                class="w-full"
                multiple
              />
            </UFormField>
          </div>

          <!-- Metadata -->
          <USeparator />
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">
                {{ t('metadata_title') }}
              </h3>
              <UButton
                v-if="selectedPhoto.cameraMake || selectedPhoto.cameraModel || selectedPhoto.fNumber || selectedPhoto.exposureTime || selectedPhoto.iso || selectedPhoto.focalLength || selectedPhoto.lensModel"
                color="error"
                variant="ghost"
                size="xs"
                icon="lucide:x"
                @click="removeMetadata"
              >
                {{ t('metadata_remove_all') }}
              </UButton>
            </div>
            <div
              v-if="selectedPhoto.takenAt"
              class="grid grid-cols-2 gap-2 text-sm"
            >
              <div class="text-gray-500">
                {{ t('metadata_taken_date') }}
              </div>
              <div>{{ formatDate(selectedPhoto.takenAt) }}</div>
            </div>
            <div
              v-if="selectedPhoto.cameraMake || selectedPhoto.cameraModel"
              class="grid grid-cols-2 gap-2 text-sm"
            >
              <div class="text-gray-500">
                {{ t('metadata_camera') }}
              </div>
              <div>{{ selectedPhoto.cameraMake }} {{ selectedPhoto.cameraModel }}</div>
            </div>
            <div
              v-if="selectedPhoto.fNumber"
              class="grid grid-cols-2 gap-2 text-sm"
            >
              <div class="text-gray-500">
                {{ t('metadata_aperture') }}
              </div>
              <div>ƒ/{{ selectedPhoto.fNumber }}</div>
            </div>
            <div
              v-if="selectedPhoto.exposureTime"
              class="grid grid-cols-2 gap-2 text-sm"
            >
              <div class="text-gray-500">
                {{ t('metadata_shutter_speed') }}
              </div>
              <div>{{ formatShutterSpeed(selectedPhoto.exposureTime) }}s</div>
            </div>
            <div
              v-if="selectedPhoto.iso"
              class="grid grid-cols-2 gap-2 text-sm"
            >
              <div class="text-gray-500">
                {{ t('metadata_iso') }}
              </div>
              <div>{{ selectedPhoto.iso }}</div>
            </div>
            <div
              v-if="selectedPhoto.focalLength"
              class="grid grid-cols-2 gap-2 text-sm"
            >
              <div class="text-gray-500">
                {{ t('metadata_focal_length') }}
              </div>
              <div>{{ selectedPhoto.focalLength }}mm</div>
            </div>
            <div
              v-if="selectedPhoto.lensModel"
              class="grid grid-cols-2 gap-2 text-sm"
            >
              <div class="text-gray-500">
                {{ t('metadata_lens') }}
              </div>
              <div>{{ selectedPhoto.lensModel }}</div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-500">
                {{ t('metadata_dimensions') }}
              </div>
              <div>{{ selectedPhoto.width }} × {{ selectedPhoto.height }}</div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-500">
                {{ t('metadata_file_size') }}
              </div>
              <div>{{ formatFileSize(selectedPhoto.fileSize) }}</div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2"
        >
          <div class="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <USkeleton class="absolute inset-0" />
          </div>
          <div class="space-y-4">
            <USkeleton class="h-5 w-40" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-5 w-32" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-5 w-48" />
            <div class="space-y-2">
              <USkeleton class="h-5 w-24" />
              <div class="flex flex-wrap gap-2">
                <USkeleton class="h-6 w-16 rounded-full" />
                <USkeleton class="h-6 w-20 rounded-full" />
                <USkeleton class="h-6 w-12 rounded-full" />
              </div>
            </div>
          </div>
          <USeparator />
          <div class="space-y-3">
            <USkeleton class="h-5 w-28" />
            <div class="grid grid-cols-2 gap-2">
              <USkeleton class="h-4 w-24" />
              <USkeleton class="h-4 w-24" />
              <USkeleton class="h-4 w-20" />
              <USkeleton class="h-4 w-28" />
              <USkeleton class="h-4 w-16" />
              <USkeleton class="h-4 w-24" />
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="outline"
          @click="isPhotoDetailsOpen = false"
        >
          {{ t('photo_details_cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          @click="savePhotoDetails"
        >
          {{ t('photo_details_save') }}
        </UButton>
        <UButton
          color="error"
          variant="outline"
          icon="lucide:trash-2"
          class="ml-auto"
          @click="confirmDelete"
        >
          {{ t('photo_details_delete') }}
        </UButton>
      </template>
    </USlideover>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showDeleteConfirm"
      :title="t('delete_photo_title')"
      :message="t('delete_photo_message', { title: deletePhotoTitle })"
      :confirm-text="t('delete_photo_confirm')"
      :cancel-text="t('delete_photo_cancel')"
      confirm-color="error"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { PhotoDetail, PhotosResponse } from "~~/shared/types/photo"
import { useAlbumsStore } from "~/stores/albums"

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { t, d } = useI18n()
const localePath = useLocalePath()

const page = ref(Number.parseInt(route.query.page as string) || 1)
const filter = ref<string | null>(route.query.filter as string || null)

const { data: photos } = await useFetch<PhotosResponse>("/api/v1/admin/photos", {
  query: {
    page,
    limit: 20,
    filter,
  },
  watch: [page, filter],
})

// Photo details slideover
const isPhotoDetailsOpen = ref(false)
const selectedPhoto = ref<PhotoDetail | null>(null)
const saving = ref(false)
const tagInput = ref("")
const photoRotation = ref(0)
const slideoverBodyRef = useTemplateRef<HTMLElement>("slideoverBodyRef")
const previewLoading = ref(false)

const { data: allTags } = await useFetch<{ tags: Array<{ id: string, name: string }> }>("/api/v1/tags", {
  query: { limit: 1000 },
})

// Delete confirmation dialog
const showDeleteConfirm = ref(false)
const deletePhotoTitle = ref("")

const photoForm = reactive({
  title: "",
  description: "",
  visibility: "public",
  tags: [] as string[],
  albumIds: [] as string[],
})

const visibilityOptions = computed(() => [
  { label: t("visibility_public"), value: "public" },
  { label: t("visibility_private"), value: "private" },
  { label: t("visibility_unlisted"), value: "unlisted" },
])

const albumsStore = useAlbumsStore()
await albumsStore.fetchAlbums()

const albumOptions = computed(() => [
  ...albumsStore.albums.map(album => ({
    label: album.title,
    value: album.id,
  })),
])

const tagSuggestions = computed(() => {
  if (!allTags.value?.tags)
    return []
  return allTags.value.tags
    .filter(tag => !photoForm.tags.includes(tag.name))
    .map(tag => tag.name)
})

async function openPhotoDetails(photoId: string) {
  // If clicking the same photo that's already open, do nothing - otherwise this will vanish the picture
  if (isPhotoDetailsOpen.value && selectedPhoto.value?.id === photoId) {
    return
  }

  isPhotoDetailsOpen.value = true
  try {
    const photo = await $fetch<PhotoDetail>(`/api/v1/admin/photos/${photoId}`)
    selectedPhoto.value = photo
    previewLoading.value = true
    photoForm.title = photo.title || ""
    photoForm.description = photo.description || ""
    photoForm.visibility = photo.visibility || "public"
    photoForm.tags = photo.tags?.map((t: any) => t.name) || []
    photoForm.albumIds = photo.albums?.map((a: any) => a.id) || []
    photoRotation.value = photo.rotation || 0

    await nextTick()
    slideoverBodyRef.value?.scrollTo({ top: 0, behavior: "smooth" })
  } catch (error) {
    console.error("Failed to load photo details:", error)
  }
}

async function rotatePhoto(degrees: number) {
  if (!selectedPhoto.value)
    return

  photoRotation.value = (photoRotation.value + degrees) % 360
  if (photoRotation.value < 0)
    photoRotation.value += 360

  try {
    await $fetch(`/api/v1/admin/photos/${selectedPhoto.value.id}`, {
      method: "PATCH" as any,
      body: {
        rotation: photoRotation.value,
      },
    })

    selectedPhoto.value.rotation = photoRotation.value

    // Update rotation in the photos grid
    if (photos.value?.photos) {
      const index = photos.value.photos.findIndex(p => p.id === selectedPhoto.value!.id)
      if (index !== -1 && photos.value.photos[index]) {
        photos.value.photos[index]!.rotation = photoRotation.value
      }
    }
  } catch (error) {
    console.error("Failed to save rotation:", error)
    photoRotation.value = selectedPhoto.value.rotation || 0
  }
}

async function removeMetadata() {
  if (!selectedPhoto.value)
    return

  try {
    await $fetch(`/api/v1/admin/photos/${selectedPhoto.value.id}`, {
      method: "PATCH" as any,
      body: {
        cameraMake: null,
        cameraModel: null,
        fNumber: null,
        exposureTime: null,
        iso: null,
        focalLength: null,
        lensModel: null,
      },
    })

    // Update local state
    selectedPhoto.value.cameraMake = null
    selectedPhoto.value.cameraModel = null
    selectedPhoto.value.fNumber = null
    selectedPhoto.value.exposureTime = null
    selectedPhoto.value.iso = null
    selectedPhoto.value.focalLength = null
    selectedPhoto.value.lensModel = null

    toast.add({
      title: t("toast_metadata_removed"),
      color: "success",
    })
  } catch (error) {
    console.error("Failed to remove metadata:", error)
    toast.add({
      title: t("toast_metadata_remove_failed"),
      color: "error",
    })
  }
}

async function savePhotoDetails() {
  if (!selectedPhoto.value)
    return

  saving.value = true
  try {
    await $fetch(`/api/v1/admin/photos/${selectedPhoto.value.id}`, {
      method: "PATCH" as any,
      body: {
        title: photoForm.title,
        description: photoForm.description,
        visibility: photoForm.visibility,
        tags: photoForm.tags,
        albumIds: photoForm.albumIds,
      },
    })

    // Refresh the photos list
    if (photos.value?.photos && selectedPhoto.value) {
      const index = photos.value.photos.findIndex(p => p.id === selectedPhoto.value!.id)
      if (index !== -1 && photos.value.photos[index]) {
        photos.value.photos[index]!.title = photoForm.title
        photos.value.photos[index]!.visibility = photoForm.visibility as any
      }
    }

    isPhotoDetailsOpen.value = false
    toast.add({
      title: t("toast_success"),
      description: t("toast_photo_updated"),
      color: "success",
    })
  } catch (error) {
    console.error("Failed to save photo:", error)
    toast.add({
      title: t("toast_error"),
      description: t("toast_photo_update_failed"),
      color: "error",
    })
  } finally {
    saving.value = false
  }
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !photoForm.tags.includes(tag)) {
    photoForm.tags.push(tag)
  }
  tagInput.value = ""
}

function removeTag(index: number) {
  photoForm.tags.splice(index, 1)
}

function confirmDelete() {
  if (!selectedPhoto.value)
    return

  deletePhotoTitle.value = selectedPhoto.value.title || "this photo"
  showDeleteConfirm.value = true
}

async function handleDeleteConfirm() {
  if (!selectedPhoto.value)
    return

  try {
    await $fetch(`/api/v1/admin/photos/${selectedPhoto.value.id}`, {
      method: "DELETE" as any,
    })

    isPhotoDetailsOpen.value = false

    const response = await $fetch<PhotosResponse>("/api/v1/admin/photos", {
      query: {
        page: page.value,
        limit: 20,
        filter: filter.value,
      },
    })

    if (photos.value) {
      photos.value = response
    }

    toast.add({
      title: t("toast_success"),
      description: t("toast_photo_deleted"),
      color: "success",
    })
  } catch (error) {
    console.error("Failed to delete photo:", error)
    toast.add({
      title: t("toast_error"),
      description: t("toast_photo_delete_failed"),
      color: "error",
    })
  }
}

function setFilter(newFilter: string | null) {
  filter.value = newFilter
  page.value = 1
  router.push({ query: { ...route.query, filter: newFilter || undefined, page: undefined } })
}

watch(() => route.query.filter, (newFilter) => {
  filter.value = newFilter as string || null
  page.value = 1
})

watch(page, (newPage) => {
  router.push({ query: { ...route.query, page: newPage > 1 ? newPage.toString() : undefined } })
  window.scrollTo({ top: 0, behavior: "smooth" })
})

function formatDate(date: string) {
  return d(new Date(date), { year: "numeric", month: "short", day: "numeric" })
}

function formatShutterSpeed(seconds: number): string {
  if (seconds >= 1)
    return `${seconds}s`
  return `1/${Math.round(1 / seconds)}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

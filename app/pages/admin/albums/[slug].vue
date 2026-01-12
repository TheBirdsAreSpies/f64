<template>
  <div class="space-y-6">
    <UPageHeader
      :title="album?.title || t('admin_album_title_fallback')"
      :description="album?.description || undefined"
    >
      <template #links>
        <UButton
          color="primary"
          variant="solid"
          icon="lucide:settings"
          :label="t('admin_album_edit')"
          @click="editAlbum"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <!-- Album Info -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <div class="text-sm text-neutral-500">
            {{ t('admin_album_visibility') }}
          </div>
          <div class="text-lg font-semibold">
            {{ getVisibilityLabel(album?.visibility) }}
          </div>
        </UCard>
        <UCard>
          <div class="text-sm text-neutral-500">
            {{ t('admin_album_photos') }}
          </div>
          <div class="text-lg font-semibold">
            {{ photoCount }}
          </div>
        </UCard>
        <UCard>
          <div class="text-sm text-neutral-500">
            {{ t('admin_album_created') }}
          </div>
          <div class="text-lg font-semibold">
            {{ formatDate(album?.createdAt) }}
          </div>
        </UCard>
      </div>

      <!-- Tags -->
      <div
        v-if="album?.tags?.length"
        class="flex gap-2 mb-6"
      >
        <UBadge
          v-for="tag in album.tags"
          :key="tag.id"
          color="neutral"
          variant="subtle"
        >
          {{ tag.name }}
        </UBadge>
      </div>

      <!-- Photos Grid -->
      <ClientOnly>
        <div
          v-if="photos.length"
          class="space-y-4"
        >
          <UAlert
            v-if="showCoverPhotoAlert"
            icon="lucide:info"
            color="info"
            :title="t('admin_album_cover_photo_title')"
            :description="t('admin_album_cover_photo_description')"
            class="mb-4"
            :close="{
              color: 'neutral',
              variant: 'subtle',
            }"
            @update:open="hideCoverPhotoAlert"
          />
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="photo in photos"
              :key="photo.id"
              class="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 group cursor-pointer"
              :class="album?.coverPhotoId === photo.id && 'ring-2 ring-primary-500'"
              @contextmenu.prevent="(e) => showPhotoMenu(photo, e)"
            >
              <NuxtImg
                :src="photo.thumbnailPath"
                :alt="photo.title"
                class="h-full w-full object-cover transition-transform group-hover:scale-110"
                :style="{
                  transform: photo.rotation
                    ? `rotate(${photo.rotation}deg)`
                    : 'none',
                }"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
              <UBadge
                v-if="album?.coverPhotoId === photo.id"
                color="primary"
                class="absolute top-2 right-2"
              >
                {{ t('admin_album_cover_photo_label') }}
              </UBadge>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-12"
        >
          <p class="text-neutral-500">
            {{ t('admin_album_empty') }}
          </p>
          <UButton
            :to="localePath('/admin/photos/upload')"
            class="mt-4"
            color="primary"
          >
            {{ t('photos_upload') }}
          </UButton>
        </div>
      </ClientOnly>
    </UPageBody>

    <!-- Edit Album Slideover -->
    <USlideover
      v-model:open="isEditOpen"
      :title="t('admin_album_edit_title')"
    >
      <template #body>
        <div class="space-y-6">
          <UFormField :label="t('admin_album_field_title')">
            <UInput
              v-model="albumForm.title"
              :placeholder="t('admin_album_field_title_placeholder')"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('admin_album_field_slug')">
            <UInput
              v-model="albumForm.slug"
              :placeholder="t('admin_album_field_slug_placeholder')"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('admin_album_field_description')">
            <UTextarea
              v-model="albumForm.description"
              :placeholder="t('admin_album_field_description_placeholder')"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('admin_album_field_visibility')">
            <USelectMenu
              v-model="albumForm.visibility"
              :items="visibilityOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <div v-if="albumForm.visibility === 'password'">
            <UFormField :label="t('admin_album_field_password')">
              <UInput
                v-model="albumForm.password"
                type="password"
                :placeholder="t('admin_album_field_password_placeholder')"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField :label="t('admin_album_field_cover_photo')">
            <USelectMenu
              v-model="albumForm.coverPhotoId"
              :items="photos.map(p => ({ label: p.title || p.id, value: p.id }))"
              value-key="value"
              searchable
              placeholder="Select a cover photo"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('admin_album_field_tags')">
            <div class="space-y-2">
              <div
                v-if="albumForm.tags.length > 0"
                class="flex flex-wrap gap-2"
              >
                <UBadge
                  v-for="(tag, index) in albumForm.tags"
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
                :placeholder="t('admin_album_field_tags_placeholder')"
                class="w-full"
                @keydown.enter.prevent="addTag"
                @update:model-value="(value) => { if (tagSuggestions.includes(value)) addTag() }"
              />
            </div>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="outline"
          @click="isEditOpen = false"
        >
          {{ t('common_cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          @click="saveAlbum"
        >
          {{ t('common_save') }}
        </UButton>
      </template>
    </USlideover>

    <!-- Photo Context Menu -->
    <div
      v-if="photoContextMenu"
      class="fixed bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50"
      :style="{ top: `${photoContextMenu.y}px`, left: `${photoContextMenu.x}px` }"
      @click.stop="photoContextMenu = null"
      @contextmenu.prevent="photoContextMenu = null"
    >
      <UButton
        variant="ghost"
        color="neutral"
        class="w-full justify-start"
        @click="setCoverPhoto(photoContextMenu.photo.id); photoContextMenu = null"
      >
        {{ t('admin_album_set_cover_photo') }}
      </UButton>
    </div>

    <!-- Close menu when clicking elsewhere -->
    <div
      v-if="photoContextMenu"
      class="fixed inset-0 z-40"
      @click="photoContextMenu = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Album } from "~~/shared/types/album"
import type { Photo } from "~~/shared/types/photo"

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t, d } = useI18n()
const localePath = useLocalePath()
const albumsStore = useAlbumsStore()

const slug = computed(() => route.params.slug as string)

const { data: album, refresh: refreshAlbum } = await useFetch<Album>(`/api/v1/admin/albums/${slug.value}`, {
  query: { includeCount: true },
})

const { data: photosData } = await useFetch<Photo[]>(`/api/v1/admin/albums/${slug.value}/photos`)
const photos = computed(() => Array.isArray(photosData.value) ? photosData.value : [])

const photoCount = computed(() => {
  const a = album.value as any
  if (a?._count && typeof a._count.photos === "number")
    return a._count.photos
  if (Array.isArray(a?.photos))
    return a.photos.length
  return Array.isArray(photos.value) ? photos.value.length : 0
})

// Edit album state
const isEditOpen = ref(false)
const saving = ref(false)
const tagInput = ref("")
const photoContextMenu = ref<{ photo: Photo, x: number, y: number } | null>(null)
const showCoverPhotoAlert = ref(true)

onMounted(() => {
  const hidden = localStorage.getItem("cover-photo-alert-hidden")
  if (hidden === "true") {
    showCoverPhotoAlert.value = false
  }
})

function hideCoverPhotoAlert() {
  showCoverPhotoAlert.value = false
  localStorage.setItem("cover-photo-alert-hidden", "true")
}

const albumForm = reactive({
  title: "",
  slug: "",
  description: "",
  visibility: "public" as "public" | "private" | "password",
  password: "",
  coverPhotoId: "",
  tags: [] as string[],
})

const { data: allTags } = await useFetch<{ tags: Array<{ id: string, name: string }> }>("/api/v1/tags", {
  query: { limit: 1000 },
})

const tagSuggestions = computed(() => {
  if (!allTags.value?.tags)
    return []
  return allTags.value.tags
    .filter(tag => !albumForm.tags.includes(tag.name))
    .map(tag => tag.name)
})

const visibilityOptions = computed(() => [
  { label: t("visibility_public"), value: "public" },
  { label: t("visibility_private"), value: "private" },
  { label: t("visibility_password"), value: "password" },
])

function getVisibilityLabel(visibility: string | undefined) {
  if (!visibility)
    return t("common_na")
  const option = visibilityOptions.value.find(opt => opt.value === visibility)
  return option?.label || visibility
}

async function setCoverPhoto(photoId: string) {
  if (!album.value)
    return

  try {
    await $fetch(`/api/v1/albums/${slug.value}`, {
      method: "patch",
      body: { coverPhotoId: photoId },
    })

    await refreshAlbum()

    toast.add({
      title: t("toast_success"),
      description: t("admin_album_cover_photo_updated"),
      color: "success",
    })
  } catch (error) {
    console.error("Failed to set cover photo:", error)
    toast.add({
      title: t("toast_error"),
      description: t("admin_album_cover_photo_failed"),
      color: "error",
    })
  }
}

function showPhotoMenu(photo: Photo, event: MouseEvent) {
  photoContextMenu.value = {
    photo,
    x: event.clientX,
    y: event.clientY,
  }
}

function formatDate(date: Date | string | undefined) {
  if (!date)
    return t("common_na")
  return d(date)
}

function editAlbum() {
  if (!album.value)
    return

  const a = album.value as any
  albumForm.title = a.title || ""
  albumForm.slug = a.slug || ""
  albumForm.description = a.description || ""
  albumForm.visibility = a.visibility || "public"
  albumForm.password = ""
  albumForm.coverPhotoId = a.coverPhotoId || ""
  albumForm.tags = a.tags?.map((t: any) => t.name) || []

  isEditOpen.value = true
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !albumForm.tags.includes(tag)) {
    albumForm.tags.push(tag)
  }
  tagInput.value = ""
}

function removeTag(index: number) {
  albumForm.tags.splice(index, 1)
}

async function saveAlbum() {
  if (!album.value)
    return

  saving.value = true
  try {
    const updateData: any = {
      title: albumForm.title,
      slug: albumForm.slug?.trim() || undefined,
      description: albumForm.description,
      visibility: albumForm.visibility,
      tags: albumForm.tags,
    }

    if (albumForm.coverPhotoId) {
      updateData.coverPhotoId = albumForm.coverPhotoId
    }

    if (albumForm.visibility === "password" && albumForm.password) {
      updateData.password = albumForm.password
    }

    const updatedAlbum = await $fetch(`/api/v1/albums/${slug.value}`, {
      method: "patch" as any,
      body: updateData,
    })

    albumsStore.updateAlbum(album.value.id, {
      title: albumForm.title,
      slug: albumForm.slug || album.value.slug,
      visibility: albumForm.visibility,
    })

    const newSlug = (updatedAlbum as any).slug
    if (newSlug && newSlug !== slug.value) {
      await router.push(localePath(`/admin/albums/${newSlug}`))
    } else {
      await refreshAlbum()
    }

    isEditOpen.value = false
    toast.add({
      title: t("toast_success"),
      description: t("toast_album_updated"),
      color: "success",
    })
  } catch (error) {
    console.error("Failed to save album:", error)
    toast.add({
      title: t("toast_error"),
      description: t("toast_album_update_failed"),
      color: "error",
    })
  } finally {
    saving.value = false
  }
}
</script>

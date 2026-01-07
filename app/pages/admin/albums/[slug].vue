<template>
  <div>
    <UPageHeader
      :title="album?.title || t('admin_album_title_fallback')"
      :description="album?.description || undefined"
    >
      <template #actions>
        <UButton
          :to="localePath('/admin')"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          :label="t('common_back')"
        />
        <UButton
          color="primary"
          variant="outline"
          icon="i-lucide-settings"
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
          <div class="text-lg font-semibold capitalize">
            {{ album?.visibility }}
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
      <div
        v-if="photos.length"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <NuxtLink
          v-for="photo in photos"
          :key="photo.id"
          :to="localePath(`/admin/photos/${photo.id}`)"
          class="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
        >
          <img
            :src="photo.thumbnailPath"
            :alt="photo.title"
            class="h-full w-full object-cover transition-transform"
            :style="{
              transform: photo.rotation
                ? `rotate(${photo.rotation}deg)`
                : 'none',
            }"
          />
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
        </NuxtLink>
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
    </UPageBody>
  </div>
</template>

<script setup lang="ts">
import type { Photo } from "~~/shared/types/photo"

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

const route = useRoute()
const { t, d } = useI18n()
const localePath = useLocalePath()

const slug = computed(() => route.params.slug as string)

const { data: album } = await useFetch(`/api/v1/albums/${slug.value}`, {
  query: { includeCount: true },
})

const { data: photosData } = await useFetch<Photo[]>(`/api/v1/albums/${slug.value}/photos`)
const photos = computed(() => Array.isArray(photosData.value) ? photosData.value : [])

const photoCount = computed(() => {
  const a = album.value as any
  if (a?._count && typeof a._count.photos === "number")
    return a._count.photos
  if (Array.isArray(a?.photos))
    return a.photos.length
  return Array.isArray(photos.value) ? photos.value.length : 0
})

function formatDate(date: Date | string | undefined) {
  if (!date)
    return t("common_na")
  return d(date)
}

function editAlbum() {
  // TODO: Open edit modal or navigate to edit page
}
</script>

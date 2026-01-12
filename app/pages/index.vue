<template>
  <div>
    <UPageHeader
      :title="t('gallery_title')"
      :description="t('gallery_description')"
    />

    <UPageBody>
      <div
        v-if="publicAlbums?.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <NuxtLink
          v-for="album in publicAlbums"
          :key="album.id"
          :to="localePath(`/albums/${album.slug}`)"
          class="group cursor-pointer"
        >
          <div class="aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <NuxtImg
              v-if="album.coverPhoto"
              :src="album.coverPhoto.thumbnailPath"
              :alt="album.title"
              :style="`transform: rotate(${album.coverPhoto.rotation || 0}deg);`"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <NuxtImg
              v-else-if="(album as any).photos?.[0]"
              :src="(album as any).photos[0].thumbnailPath"
              :alt="(album as any).photos[0].title || album.title"
              :style="`transform: rotate(${(album as any).photos[0].rotation || 0}deg);`"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon
                name="lucide:folder"
                class="text-6xl text-gray-400"
              />
            </div>
          </div>
          <div class="mt-3">
            <h3 class="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ album.title }}
            </h3>
            <p
              v-if="album.description"
              class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2"
            >
              {{ album.description }}
            </p>
            <div class="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <span class="flex items-center gap-1">
                <UIcon name="lucide:image" />
                {{ album._count?.photos || 0 }} {{ t('gallery_photos') }}
              </span>
              <span
                v-if="album.tags?.length"
                class="flex items-center gap-1"
              >
                <UIcon name="lucide:tag" />
                {{ album.tags.length }} {{ t('gallery_tags') }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div
        v-else
        class="text-center py-16"
      >
        <UIcon
          name="lucide:folder-open"
          class="text-6xl text-gray-400 mb-4"
        />
        <p class="text-xl text-gray-600 dark:text-gray-400">
          {{ t('gallery_empty') }}
        </p>
      </div>
    </UPageBody>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const { data: albums } = await useFetch("/api/v1/albums")

const publicAlbums = computed(() => {
  if (!albums.value?.albums)
    return []
  return albums.value.albums.filter(album => album.visibility !== "private")
})
</script>

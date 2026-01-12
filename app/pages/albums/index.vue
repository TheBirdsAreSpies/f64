<template>
  <div>
    <UPageHero
      :title="t('albums_title')"
      :description="t('albums_description')"
    />

    <UPageBody>
      <div
        v-if="pending"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <USkeleton
          v-for="i in 6"
          :key="i"
          class="h-64"
        />
      </div>

      <div
        v-else-if="publicAlbums?.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <NuxtLink
          v-for="album in publicAlbums"
          :key="album.id"
          :to="localePath(`/albums/${album.slug}`)"
          class="group"
        >
          <UCard class="overflow-hidden hover:shadow-lg transition-shadow">
            <div class="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
              <NuxtImg
                v-if="album.coverPhoto"
                :src="album.coverPhoto.thumbnailPath"
                :alt="album.title"
                :style="`transform: rotate(${album.coverPhoto.rotation || 0}deg);`"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <UIcon
                  name="lucide:image"
                  class="text-6xl text-gray-400"
                />
              </div>
            </div>

            <template #footer>
              <div>
                <h3 class="font-semibold text-lg mb-1">
                  {{ album.title }}
                </h3>
                <p
                  v-if="album.description"
                  class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                >
                  {{ album.description }}
                </p>
                <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{{ album._count?.photos || 0 }} {{ t('albums_photos') }}</span>
                  <div
                    v-if="album.tags?.length"
                    class="flex gap-1"
                  >
                    <UBadge
                      v-for="tag in album.tags.slice(0, 2)"
                      :key="tag.id"
                      size="xs"
                      color="neutral"
                      variant="subtle"
                    >
                      {{ tag.name }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </template>
          </UCard>
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
          {{ t('albums_empty') }}
        </p>
      </div>
    </UPageBody>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()

const albumsStore = useAlbumsStore()
const pending = ref(true)

onMounted(async () => {
  if (!albumsStore.albums.length) {
    await albumsStore.fetchAlbums(100)
  }
  pending.value = false
})

const publicAlbums = computed(() => {
  return albumsStore.albums.filter(album => album.visibility !== "private")
})
</script>

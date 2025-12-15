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
      >
        <NuxtImg
          :src="photo.thumbnailPath"
          :alt="photo.title"
          class="w-full h-full object-cover"
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
            <UButton
              icon="lucide:ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="xs"
              square
            />
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
        v-model="page"
        :total="photos.pagination.total"
        :page-count="photos.pagination.limit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

interface Photo {
  id: string
  title: string
  thumbnailPath: string
  originalPath: string
  visibility: string
  uploadedAt: string
  isFavorite: boolean
  isFeatured: boolean
  width: number
  height: number
}

interface PhotosResponse {
  photos: Photo[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const route = useRoute()
const router = useRouter()

const { t, d } = useI18n()
const localePath = useLocalePath()

const page = ref(1)
const filter = ref<string | null>(route.query.filter as string || null)

const queryParams = computed(() => ({
  page: page.value,
  limit: 20,
  ...(filter.value && { filter: filter.value }),
  ...(route.query.year && { year: route.query.year }),
}))

const { data: photos, refresh } = await useFetch<PhotosResponse>("/api/v1/admin/photos", {
  query: queryParams,
})

function setFilter(newFilter: string | null) {
  filter.value = newFilter
  page.value = 1
  router.push({ query: { ...route.query, filter: newFilter || undefined } })
  refresh()
}

watch(() => route.query.filter, (newFilter) => {
  filter.value = newFilter as string || null
  refresh()
})

watch(page, () => {
  refresh()
})

function formatDate(date: string) {
  return d(new Date(date), { year: "numeric", month: "short", day: "numeric" })
}
</script>

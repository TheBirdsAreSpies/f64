<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ t('dashboard_title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          {{ t('dashboard_welcome') }}
        </p>
      </div>
      <UButton
        :to="localePath('/admin/photos/upload')"
        icon="lucide:upload"
        :label="t('dashboard_upload_photos')"
        size="lg"
      />
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('dashboard_stats_photos') }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ stats?.photos || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <UIcon
              name="lucide:image"
              class="text-blue-600 dark:text-blue-400 text-xl"
            />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('dashboard_stats_albums') }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ stats?.albums || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <UIcon
              name="lucide:folder"
              class="text-purple-600 dark:text-purple-400 text-xl"
            />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('dashboard_stats_likes') }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ stats?.likes || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
            <UIcon
              name="lucide:heart"
              class="text-pink-600 dark:text-pink-400 text-xl"
            />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('dashboard_stats_storage') }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ stats?.storage || '0 B' }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <UIcon
              name="lucide:hard-drive"
              class="text-green-600 dark:text-green-400 text-xl"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UButton
        :to="localePath('/admin/photos/upload')"
        variant="outline"
        color="neutral"
        class="h-auto p-6 justify-start group"
        block
      >
        <div class="flex flex-col items-start gap-4 w-full">
          <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <UIcon
              name="lucide:upload"
              class="text-primary-600 dark:text-primary-400 text-xl"
            />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ t('dashboard_quick_upload_title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('dashboard_quick_upload_desc') }}
            </p>
          </div>
        </div>
      </UButton>

      <UButton
        :to="localePath('/admin/albums/new')"
        variant="outline"
        color="neutral"
        class="h-auto p-6 justify-start group"
        block
      >
        <div class="flex flex-col items-start gap-4 w-full">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <UIcon
              name="lucide:folder-plus"
              class="text-purple-600 dark:text-purple-400 text-xl"
            />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ t('dashboard_quick_album_title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('dashboard_quick_album_desc') }}
            </p>
          </div>
        </div>
      </UButton>

      <UButton
        :to="localePath('/admin/tags')"
        variant="outline"
        color="neutral"
        class="h-auto p-6 justify-start group"
        block
      >
        <div class="flex flex-col items-start gap-4 w-full">
          <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <UIcon
              name="lucide:tags"
              class="text-orange-600 dark:text-orange-400 text-xl"
            />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ t('dashboard_quick_tags_title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('dashboard_quick_tags_desc') }}
            </p>
          </div>
        </div>
      </UButton>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Photos -->
      <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ t('dashboard_recent_photos') }}
          </h3>
        </div>
        <div class="p-6">
          <div
            v-if="recentPhotos?.length"
            class="space-y-4"
          >
            <div
              v-for="photo in recentPhotos"
              :key="photo.id"
              class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <NuxtImg
                  :src="photo.thumbnailPath"
                  :alt="photo.title"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ photo.title }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(photo.uploadedAt) }}
                </p>
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-center py-12"
          >
            <UIcon
              name="lucide:image-off"
              class="text-4xl text-gray-400 dark:text-gray-600 mb-2"
            />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('dashboard_no_photos') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ t('dashboard_recent_activity') }}
          </h3>
        </div>
        <div class="p-6">
          <div class="text-center py-12">
            <UIcon
              name="lucide:activity"
              class="text-4xl text-gray-400 dark:text-gray-600 mb-2"
            />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('dashboard_no_activity') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

const { t, d } = useI18n()
const localePath = useLocalePath()

const { data: stats } = await useFetch("/api/v1/admin/stats")
const { data: recentPhotos } = await useFetch("/api/v1/admin/photos/recent")

function formatDate(date: string) {
  return d(new Date(date), {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
</script>

<template>
  <div>
    <!-- Password Modal -->
    <UModal
      v-model:open="showPasswordModal"
      :title="t('album_password_title')"
      :close="false"
    >
      <template #body>
        <UForm
          :state="{ password: albumPassword }"
          @submit="verifyPassword"
        >
          <UFormField
            :label="t('album_password_label')"
            name="password"
          >
            <UInput
              v-model="albumPassword"
              type="password"
              :placeholder="t('album_password_placeholder')"
              class="w-full"
            />
          </UFormField>

          <div class="flex gap-3 mt-4">
            <UButton
              color="neutral"
              variant="outline"
              @click="showPasswordModal = false; navigateTo(localePath('/albums'))"
            >
              {{ t('common_cancel') }}
            </UButton>
            <UButton
              type="submit"
              :loading="verifying"
            >
              {{ t('common_submit') }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Album Content -->
    <div v-if="album">
      <UPageHeader
        :title="album.title"
        :description="album.description || undefined"
      >
        <template #links>
          <UButton
            :to="localePath('/albums')"
            color="neutral"
            variant="ghost"
            icon="lucide:arrow-left"
            :label="t('albums_back_to_list')"
          />
        </template>
      </UPageHeader>

      <UPageBody>
        <!-- Tags -->
        <div
          v-if="album.tags && album.tags.length > 0"
          class="flex flex-wrap gap-2 mb-6"
        >
          <UBadge
            v-for="tag in album.tags"
            :key="tag.id"
            color="primary"
            variant="subtle"
          >
            {{ tag.name }}
          </UBadge>
        </div>

        <!-- Photos Grid -->
        <div
          v-if="album.photos?.length"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <div
            v-for="photo in album.photos"
            :key="photo.id"
            class="group cursor-pointer"
            @click="openPhotoModal(photo)"
          >
            <div class="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <div
                class="w-full h-full"
                :style="{ transform: photo.rotation ? `rotate(${photo.rotation}deg)` : undefined }"
              >
                <NuxtImg
                  :src="photo.thumbnailPath"
                  :alt="photo.title"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </div>
            <div class="mt-2">
              <p class="font-medium text-sm truncate">
                {{ photo.title }}
              </p>
              <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span class="flex items-center gap-1">
                  <UIcon name="lucide:heart" />
                  {{ photo._count?.likes || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="lucide:message-circle" />
                  {{ photo._count?.comments || 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-16"
        >
          <UIcon
            name="lucide:image-off"
            class="text-6xl text-gray-400 mb-4"
          />
          <p class="text-xl text-gray-600 dark:text-gray-400">
            {{ t('album_empty') }}
          </p>
        </div>
      </UPageBody>
    </div>

    <AlbumPhotoViewer
      v-model:open="showPhotoModal"
      :photos="album?.photos || []"
      :initial-photo-id="selectedPhotoId"
    />
  </div>
</template>

<script setup lang="ts">
import type { Album } from "~~/shared/types/album"
import type { Photo } from "~~/shared/types/photo"

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()

const slug = route.params.slug as string

const showPasswordModal = ref(false)
const albumPassword = ref("")
const verifying = ref(false)
const passwordHeader = ref("")

const { data: album, error, refresh } = await useFetch<Album>(`/api/v1/albums/${slug}`, {
  headers: computed(() => ({
    "x-album-password": passwordHeader.value,
  })),
  watch: false,
})

watch(error, (newError) => {
  showPasswordModal.value = newError?.statusCode === 403
}, { immediate: true })

async function verifyPassword() {
  verifying.value = true
  passwordHeader.value = albumPassword.value
  await refresh()
  verifying.value = false
  if (!error.value) {
    showPasswordModal.value = false
  }
}

const showPhotoModal = ref(false)
const selectedPhotoId = ref<string | null>(null)

function openPhotoModal(photo: Photo) {
  selectedPhotoId.value = photo.id
  showPhotoModal.value = true
}
</script>

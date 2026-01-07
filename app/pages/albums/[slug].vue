<template>
  <div>
    <!-- Password Modal -->
    <UModal
      v-model:open="showPasswordModal"
      :title="t('album_password_title')"
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
            />
          </UFormField>

          <div class="flex gap-3 mt-4">
            <UButton
              type="submit"
              :loading="verifying"
            >
              {{ t('common_submit') }}
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              @click="showPasswordModal = false; navigateTo(localePath('/albums'))"
            >
              {{ t('common_cancel') }}
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
        <template #actions>
          <UButton
            to="/albums"
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
          v-if="album.tags?.length"
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

    <!-- Photo Modal -->
    <UModal
      v-model:open="showPhotoModal"
      :title="selectedPhoto?.title"
      fullscreen
    >
      <template #body>
        <div
          v-if="selectedPhoto"
          class="grid h-full relative"
          :class="showSidebar ? 'grid-cols-1 lg:grid-cols-[1fr_320px] gap-6' : 'grid-cols-1'"
        >
          <!-- Navigation Buttons -->
          <UButton
            type="button"
            icon="lucide:chevron-left"
            color="primary"
            variant="solid"
            class="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity z-10"
            @click="navigatePhoto('prev')"
          />
          <UButton
            type="button"
            icon="lucide:chevron-right"
            color="primary"
            variant="solid"
            class="absolute top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity z-10"
            :class="showSidebar ? 'right-4 lg:right-[356px]' : 'right-4'"
            @click="navigatePhoto('next')"
          />

          <!-- Photo -->
          <div class="relative flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
            <div
              ref="imageContainer"
              class="max-h-full w-full flex items-center justify-center p-4"
              :class="zoomLevel > 0 ? 'cursor-move' : 'cursor-zoom-in'"
              @click="handleImageClick($event)"
              @dblclick="handleDoubleClick"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
            >
              <USkeleton
                v-if="imageLoading"
                class="w-full aspect-video rounded-lg"
              />
              <NuxtImg
                v-show="!imageLoading"
                :src="selectedPhoto.originalPath"
                :alt="selectedPhoto.title"
                :style="{
                  transform: `${selectedPhoto?.rotation ? `rotate(${selectedPhoto.rotation}deg) ` : ''}${zoomLevel > 0
                    ? `scale(${(90 + zoomLevel * 10) / 100}) translate(${imagePosition.x / ((90 + zoomLevel * 10) / 100)}px, ${imagePosition.y / ((90 + zoomLevel * 10) / 100)}px)`
                    : 'scale(1)'}`,
                  maxWidth: zoomLevel > 0 ? 'none' : '100%',
                  maxHeight: zoomLevel > 0 ? 'none' : (showSidebar ? 'calc(100vh - 12rem)' : 'calc(100vh - 8rem)'),
                }"
                class="rounded-lg object-contain select-none"
                :class="zoomLevel > 0 ? '' : 'transition-transform duration-300'"
                draggable="false"
                @load="imageLoading = false"
                @error="imageLoading = false"
              />
            </div>

            <!-- Hover trigger area for zoom controls -->
            <div class="absolute bottom-0 left-0 right-0 h-24 group">
              <!-- Zoom Controls -->
              <div
                class="absolute left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-3 transition-all duration-300"
                :class="[
                  zoomLevel > 0 ? 'opacity-100 bottom-4' : 'opacity-40 group-hover:opacity-100 -bottom-12 group-hover:bottom-4',
                ]"
              >
                <UButton
                  type="button"
                  icon="lucide:minus"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  :disabled="zoomLevel <= 0"
                  @click="handleZoomOut"
                />
                <input
                  v-model.number="zoomLevel"
                  type="range"
                  min="0"
                  max="31"
                  step="1"
                  class="w-32 accent-primary-500"
                  @input="handleZoomChange"
                />
                <span class="text-sm font-medium min-w-12 text-center">{{ zoomLevel === 0 ? t('photo_zoom_fit') : `${90 + zoomLevel * 10}%` }}</span>
                <UButton
                  type="button"
                  icon="lucide:plus"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  :disabled="zoomLevel >= 31"
                  @click="handleZoomIn"
                />
              </div>
            </div>

            <!-- Toggle Sidebar Button -->
            <UButton
              type="button"
              :icon="showSidebar ? 'lucide:panel-right-close' : 'lucide:panel-right-open'"
              color="primary"
              variant="solid"
              class="absolute top-4 right-4"
              @click="showSidebar = !showSidebar"
            />
          </div>

          <!-- Details & Comments -->
          <div
            v-show="showSidebar"
            class="space-y-6 overflow-y-auto"
          >
            <div v-if="selectedPhoto.description">
              <p class="text-gray-600 dark:text-gray-400">
                {{ selectedPhoto.description }}
              </p>
            </div>

            <!-- EXIF Metadata -->
            <div v-if="selectedPhoto.cameraMake || selectedPhoto.cameraModel || selectedPhoto.width">
              <h4 class="font-semibold mb-3">
                {{ t('photo_details_title') }}
              </h4>
              <div class="space-y-2 text-sm">
                <div
                  v-if="selectedPhoto.cameraMake || selectedPhoto.cameraModel"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:camera"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_camera') }}:</span>
                  <span class="font-medium ml-auto">{{ selectedPhoto.cameraMake }} {{ selectedPhoto.cameraModel }}</span>
                </div>
                <div
                  v-if="selectedPhoto.lensModel"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:scan"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_lens') }}:</span>
                  <span class="font-medium ml-auto">{{ selectedPhoto.lensModel }}</span>
                </div>
                <div
                  v-if="selectedPhoto.focalLength"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:maximize"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_focal_length') }}:</span>
                  <span class="font-medium ml-auto">{{ selectedPhoto.focalLength }}mm</span>
                </div>
                <div
                  v-if="selectedPhoto.fNumber"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:aperture"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_aperture') }}:</span>
                  <span class="font-medium ml-auto">ƒ/{{ selectedPhoto.fNumber }}</span>
                </div>
                <div
                  v-if="selectedPhoto.exposureTime"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:timer"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_shutter_speed') }}:</span>
                  <span class="font-medium ml-auto">{{ formatExposureTime(selectedPhoto.exposureTime) }}</span>
                </div>
                <div
                  v-if="selectedPhoto.iso"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:sun"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_iso') }}:</span>
                  <span class="font-medium ml-auto">{{ selectedPhoto.iso }}</span>
                </div>
                <div
                  v-if="selectedPhoto.width && selectedPhoto.height"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:arrow-up-down"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_dimensions') }}:</span>
                  <span class="font-medium ml-auto">{{ selectedPhoto.width }} × {{ selectedPhoto.height }}</span>
                </div>
                <div
                  v-if="selectedPhoto.takenAt"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="lucide:calendar"
                    class="text-gray-400 shrink-0"
                  />
                  <span class="text-gray-500">{{ t('metadata_taken_date') }}:</span>
                  <span class="font-medium ml-auto">{{ new Date(selectedPhoto.takenAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <UButton
                icon="lucide:heart"
                :color="isLiked ? 'primary' : 'neutral'"
                @click="toggleLike"
              >
                {{ likeCount }} {{ t('photo_likes') }}
              </UButton>
            </div>

            <!-- Comments -->
            <div>
              <h4 class="font-semibold mb-4">
                {{ t('comments_title') }}
              </h4>

              <div class="space-y-4 max-h-96 overflow-y-auto mb-4">
                <div
                  v-for="comment in comments"
                  :key="comment.id"
                  class="border-b border-gray-200 dark:border-gray-700 pb-3"
                >
                  <p class="font-medium text-sm">
                    {{ comment.user.firstName }} {{ comment.user.lastName }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ comment.content }}
                  </p>
                </div>

                <div
                  v-if="!comments?.length"
                  class="text-center text-gray-500 py-4"
                >
                  {{ t('comments_empty') }}
                </div>
              </div>

              <!-- Add Comment -->
              <UForm
                v-if="session?.user"
                :state="{ comment: newComment }"
                @submit="addComment"
              >
                <div class="flex gap-2">
                  <UInput
                    v-model="newComment"
                    :placeholder="t('comments_add_placeholder')"
                    class="flex-1"
                  />
                  <UButton
                    type="submit"
                    :loading="submittingComment"
                    icon="lucide:send"
                  >
                    {{ t('comments_post') }}
                  </UButton>
                </div>
              </UForm>

              <p
                v-else
                class="text-sm text-gray-500 text-center"
              >
                <NuxtLink
                  :to="localePath('login')"
                  class="text-primary-600 hover:text-primary-500"
                >
                  {{ t('nav_login') }}
                </NuxtLink>
                {{ t('comments_to_comment') }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </UModal>
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
const selectedPhoto = ref<Photo | null>(null)
const currentPhotoIndex = ref(0)
const imageLoading = ref(false)
const showSidebar = ref(true)
const zoomLevel = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const imagePosition = ref({ x: 0, y: 0 })
const imageContainer = useTemplateRef<HTMLElement>("imageContainer")
const comments = ref<any[]>([])
const newComment = ref("")
const submittingComment = ref(false)
const isLiked = ref(false)
const likeCount = ref(0)

const session = await useUserSession()

function openPhotoModal(photo: Photo) {
  selectedPhoto.value = photo
  currentPhotoIndex.value = album.value?.photos?.findIndex((p: any) => p.id === photo.id) ?? 0
  imageLoading.value = true
  zoomLevel.value = 0
  imagePosition.value = { x: 0, y: 0 }
  isLiked.value = false // TODO: Check if user liked
  likeCount.value = photo._count?.likes || 0
  loadComments(photo.id)
  showPhotoModal.value = true
}

function navigatePhoto(direction: "prev" | "next") {
  if (!album.value?.photos)
    return

  const newIndex = direction === "next"
    ? (currentPhotoIndex.value + 1) % album.value.photos.length
    : (currentPhotoIndex.value - 1 + album.value.photos.length) % album.value.photos.length

  const newPhoto = album.value.photos[newIndex]
  if (newPhoto) {
    openPhotoModal(newPhoto)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!showPhotoModal.value)
    return

  if (e.key === "ArrowLeft") {
    e.preventDefault()
    navigatePhoto("prev")
  } else if (e.key === "ArrowRight") {
    e.preventDefault()
    navigatePhoto("next")
  } else if (e.key === "Escape") {
    showPhotoModal.value = false
  } else if (e.key === "+" || e.key === "=") {
    e.preventDefault()
    handleZoomIn()
  } else if (e.key === "-" || e.key === "_") {
    e.preventDefault()
    handleZoomOut()
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown)
})

function handleImageClick(e: MouseEvent) {
  if (zoomLevel.value === 0) {
    const container = imageContainer.value
    if (container) {
      const img = container.querySelector("img") as HTMLImageElement
      if (!img)
        return

      const containerRect = container.getBoundingClientRect()
      const imgRect = img.getBoundingClientRect()

      const zoomedWidth = img.naturalWidth
      const zoomedHeight = img.naturalHeight

      if (zoomedWidth < containerRect.width && zoomedHeight < containerRect.height) {
        imagePosition.value = { x: 0, y: 0 }
      } else {
        const clickOnImageX = e.clientX - imgRect.left
        const clickOnImageY = e.clientY - imgRect.top

        const clickFromCenterX = clickOnImageX - imgRect.width / 2
        const clickFromCenterY = clickOnImageY - imgRect.height / 2

        const fitScale = imgRect.width / img.naturalWidth
        const targetScale = 1.0 // 100%
        const scaleRatio = targetScale / fitScale

        const posX = -clickFromCenterX * scaleRatio
        const posY = -clickFromCenterY * scaleRatio

        imagePosition.value = { x: posX, y: posY }
      }

      zoomLevel.value = 1
    }
  } else if (imagePosition.value.x === 0 && imagePosition.value.y === 0) {
    zoomLevel.value = 0
    imagePosition.value = { x: 0, y: 0 }
  }
}

function handleDoubleClick() {
  zoomLevel.value = 0
  imagePosition.value = { x: 0, y: 0 }
}

function handleMouseDown(e: MouseEvent) {
  if (zoomLevel.value <= 0)
    return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - imagePosition.value.x,
    y: e.clientY - imagePosition.value.y,
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || zoomLevel.value <= 0)
    return
  e.preventDefault()

  const newX = e.clientX - dragStart.value.x
  const newY = e.clientY - dragStart.value.y

  imagePosition.value = { x: newX, y: newY }
}

function handleMouseUp() {
  isDragging.value = false
}

function handleZoomIn() {
  zoomLevel.value = Math.min(31, zoomLevel.value + 1)
}

function handleZoomOut() {
  zoomLevel.value = Math.max(0, zoomLevel.value - 1)
  if (zoomLevel.value === 0 || zoomLevel.value === 1) {
    imagePosition.value = { x: 0, y: 0 }
  }
}

function handleZoomChange() {
  if (zoomLevel.value === 0 || zoomLevel.value === 1) {
    imagePosition.value = { x: 0, y: 0 }
  }
}

async function loadComments(photoId: string) {
  const response = await $fetch(`/api/v1/photos/${photoId}/comments`)
  comments.value = response
}

async function toggleLike() {
  if (!session.user || !selectedPhoto.value)
    return

  const response = await $fetch(`/api/v1/photos/${selectedPhoto.value.id}/like`, {
    method: "POST",
  })

  isLiked.value = response.liked
  likeCount.value += response.liked ? 1 : -1
}

async function addComment() {
  if (!newComment.value.trim() || !selectedPhoto.value)
    return

  submittingComment.value = true

  try {
    await $fetch("/api/v1/comments", {
      method: "POST",
      body: {
        content: newComment.value,
        photoId: selectedPhoto.value.id,
      },
    })

    newComment.value = ""
    await loadComments(selectedPhoto.value.id)
  } finally {
    submittingComment.value = false
  }
}

function formatExposureTime(seconds: number): string {
  if (seconds >= 1) {
    return `${seconds}s`
  }
  const denominator = Math.round(1 / seconds)
  return `1/${denominator}s`
}
</script>

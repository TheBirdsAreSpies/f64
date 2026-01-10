<template>
  <UModal
    v-model:open="isOpen"
    :title="selectedPhoto?.title"
    :close="showCloseButton"
    fullscreen
  >
    <template #body>
      <div
        v-if="selectedPhoto"
        class="grid h-full relative"
        :class="showSidebar ? 'grid-cols-1 lg:grid-cols-[1fr_320px] gap-6' : 'grid-cols-1'"
      >
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

          <div class="absolute bottom-0 left-0 right-0 h-24 group">
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

          <UButton
            type="button"
            :icon="showSidebar ? 'lucide:panel-right-close' : 'lucide:panel-right-open'"
            color="primary"
            variant="solid"
            class="absolute top-4 right-4"
            @click="showSidebar = !showSidebar"
          />
        </div>

        <div
          v-show="showSidebar"
          class="space-y-6 overflow-y-auto"
        >
          <div v-if="selectedPhoto.description">
            <p class="text-gray-600 dark:text-gray-400">
              {{ selectedPhoto.description }}
            </p>
          </div>

          <div v-if="hasMetadata">
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

          <div class="flex gap-3">
            <UButton
              icon="lucide:heart"
              :color="isLiked ? 'primary' : 'neutral'"
              @click="toggleLike"
            >
              {{ likeCount }} {{ t('photo_likes') }}
            </UButton>
          </div>

          <!-- Social Share Buttons -->
          <div>
            <h4 class="font-semibold mb-3">
              {{ t('share_title') }}
            </h4>
            <div class="flex flex-wrap gap-2">
              <UTooltip :text="t('share_twitter')">
                <UButton
                  icon="lucide:twitter"
                  color="primary"
                  size="sm"
                  :aria-label="t('share_twitter')"
                  @click="shareOnTwitter"
                />
              </UTooltip>
              <UTooltip :text="t('share_facebook')">
                <UButton
                  icon="lucide:facebook"
                  color="primary"
                  size="sm"
                  :aria-label="t('share_facebook')"
                  @click="shareOnFacebook"
                />
              </UTooltip>
              <UTooltip :text="t('share_linkedin')">
                <UButton
                  icon="lucide:linkedin"
                  color="primary"
                  size="sm"
                  :aria-label="t('share_linkedin')"
                  @click="shareOnLinkedIn"
                />
              </UTooltip>
              <UTooltip :text="t('share_email')">
                <UButton
                  icon="lucide:mail"
                  color="primary"
                  size="sm"
                  :aria-label="t('share_email')"
                  @click="shareViaEmail"
                />
              </UTooltip>
              <UTooltip :text="t('share_copy_link')">
                <UButton
                  icon="lucide:link"
                  color="primary"
                  size="sm"
                  :aria-label="t('share_copy_link')"
                  @click="copyLink"
                />
              </UTooltip>
            </div>
          </div>

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
</template>

<script setup lang="ts">
import type { Photo } from "~~/shared/types/photo"

const props = withDefaults(defineProps<{
  photos: Photo[]
  open: boolean
  initialPhotoId?: string | null
  showCloseButton?: boolean
}>(), {
  showCloseButton: true,
})

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const session = await useUserSession()

const isOpen = ref(props.open)
watch(() => props.open, (val) => {
  isOpen.value = val
})
watch(isOpen, val => emit("update:open", val))

const currentPhotoIndex = ref(0)
const selectedPhoto = computed(() => props.photos[currentPhotoIndex.value])

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

const hasMetadata = computed(() => {
  const p = selectedPhoto.value
  if (!p)
    return false
  return !!(p.cameraMake || p.cameraModel || p.lensModel || p.focalLength || p.fNumber || p.exposureTime || p.iso || (p.width && p.height) || p.takenAt)
})

watch(
  () => props.initialPhotoId,
  (id) => {
    if (!id)
      return
    const idx = props.photos.findIndex(p => p.id === id)
    if (idx !== -1) {
      setPhoto(idx)
    }
  },
  { immediate: true },
)

watch(
  () => props.photos,
  (photos) => {
    if (!photos.length) {
      currentPhotoIndex.value = 0
    } else {
      currentPhotoIndex.value = Math.min(currentPhotoIndex.value, photos.length - 1)
    }
  },
)

function setPhoto(index: number) {
  if (!props.photos.length)
    return
  currentPhotoIndex.value = (index + props.photos.length) % props.photos.length
  const photo = selectedPhoto.value
  if (photo) {
    imageLoading.value = true
    zoomLevel.value = 0
    imagePosition.value = { x: 0, y: 0 }
    isLiked.value = false
    likeCount.value = photo._count?.likes || 0
    loadComments(photo.id)
  }
}

function navigatePhoto(direction: "prev" | "next") {
  if (!props.photos.length)
    return
  const newIndex = direction === "next"
    ? (currentPhotoIndex.value + 1) % props.photos.length
    : (currentPhotoIndex.value - 1 + props.photos.length) % props.photos.length
  setPhoto(newIndex)
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value)
    return

  if (e.key === "ArrowLeft") {
    e.preventDefault()
    navigatePhoto("prev")
  } else if (e.key === "ArrowRight") {
    e.preventDefault()
    navigatePhoto("next")
  } else if (e.key === "Escape") {
    isOpen.value = false
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
  if (!selectedPhoto.value)
    return
  if (zoomLevel.value === 0) {
    const container = imageContainer.value
    if (container) {
      const img = container.querySelector("img") as HTMLImageElement | null
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
        const targetScale = 1.0
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
    const comment = await $fetch(`/api/v1/photos/${selectedPhoto.value.id}/comments`, {
      method: "POST" as any,
      body: { content: newComment.value },
    })

    comments.value.push(comment)
    newComment.value = ""
  } catch (error) {
    console.error("Failed to add comment:", error)
  } finally {
    submittingComment.value = false
  }
}

// Social share functions
function getPhotoUrl() {
  if (!selectedPhoto.value)
    return ""
  const baseUrl = window.location.origin
  return `${baseUrl}${localePath(`/photos/${selectedPhoto.value.id}`)}`
}

function shareOnTwitter() {
  const url = getPhotoUrl()
  const text = selectedPhoto.value?.title || "Check out this photo"
  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank")
}

function shareOnFacebook() {
  const url = getPhotoUrl()
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
}

function shareOnLinkedIn() {
  const url = getPhotoUrl()
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
}

function shareViaEmail() {
  const url = getPhotoUrl()
  const subject = selectedPhoto.value?.title || "Check out this photo"
  const body = `I thought you might like this photo: ${url}`
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

async function copyLink() {
  const url = getPhotoUrl()
  try {
    await navigator.clipboard.writeText(url)
    const toast = useToast()
    toast.add({
      title: t("share_link_copied"),
      color: "success",
    })
  } catch (error) {
    console.error("Failed to copy link:", error)
  }
}

function formatExposureTime(seconds: number): string {
  if (seconds >= 1) {
    return `${seconds}s`
  }
  const denominator = Math.round(1 / seconds)
  return `1/${denominator}s`
}

watch(
  () => isOpen.value,
  (val) => {
    if (val) {
      if (props.initialPhotoId) {
        const idx = props.photos.findIndex(p => p.id === props.initialPhotoId)
        if (idx !== -1) {
          setPhoto(idx)
        }
      } else if (props.photos.length) {
        setPhoto(currentPhotoIndex.value)
      }
    }
    if (!val) {
      zoomLevel.value = 0
      imagePosition.value = { x: 0, y: 0 }
    }
  },
)
</script>

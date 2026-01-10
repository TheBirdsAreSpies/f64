<template>
  <div>
    <AlbumPhotoViewer
      v-model:open="isOpen"
      :photos="photos"
      :initial-photo-id="photoId"
      :show-close-button="false"
      @update:open="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import type { Photo } from "~~/shared/types/photo"

const route = useRoute()
const router = useRouter()

const photoId = computed(() => route.params.id as string)

const { data: photo } = await useFetch<Photo>(`/api/v1/photos/${photoId.value}`)

const photos = computed(() => photo.value ? [photo.value] : [])

const isOpen = ref(true)

function handleClose(value: boolean) {
  if (!value) {
    router.back()
  }
}

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      isOpen.value = true
    }
  },
)
</script>

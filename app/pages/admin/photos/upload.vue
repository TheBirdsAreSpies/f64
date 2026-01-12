<template>
  <div>
    <UPageHeader
      :title="t('upload_title')"
      :description="t('upload_description')"
    />

    <UPageBody>
      <UCard>
        <UForm
          :state="form"
          @submit="onSubmit"
        >
          <div class="space-y-6">
            <UFormField
              :label="t('upload_select_photos')"
              name="files"
            >
              <div class="space-y-3">
                <UFileUpload
                  v-model="uploadedFiles"
                  multiple
                  :label="t('upload_select_photos')"
                  accept="image/*,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2,.pef,.srw"
                  :preview="false"
                />
                <!-- Custom Preview Grid -->
                <div
                  v-if="selectedFiles.length > 0"
                  class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                >
                  <div
                    v-for="(item, index) in selectedFiles"
                    :key="index"
                    class="relative aspect-square rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                  >
                    <UButton
                      variant="ghost"
                      size="xs"
                      class="absolute top-2 right-2 z-10 bg-black/40 text-white hover:bg-black/60"
                      icon="lucide:x"
                      :padded="false"
                      @click="removeFile(index)"
                    >
                      {{ t('upload_remove_one') }}
                    </UButton>
                    <img
                      v-if="item.preview"
                      :src="item.preview"
                      :alt="item.name"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900"
                    >
                      <UIcon
                        name="lucide:file-image"
                        class="w-12 h-12 text-gray-400"
                      />
                      <span class="text-xs text-gray-500 mt-2 px-2 text-center">RAW</span>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                      {{ item.name }}
                    </div>
                  </div>
                </div>
                <UButton
                  v-if="uploadedFiles && uploadedFiles.length > 0"
                  color="neutral"
                  variant="outline"
                  icon="lucide:trash-2"
                  size="sm"
                  @click="removeAll"
                >
                  {{ t('upload_remove_all') }}
                </UButton>
              </div>
            </UFormField>

            <!-- Album Selection -->
            <UFormField
              :label="t('upload_album_label')"
              name="albumIds"
            >
              <USelectMenu
                v-model="form.albumIds"
                multiple
                create-item
                :items="albumOptions"
                value-key="value"
                class="w-full"
                :placeholder="t('upload_album_placeholder')"
                @create="onCreateAlbum"
              />
            </UFormField>

            <!-- Visibility -->
            <UFormField
              :label="t('upload_visibility_label')"
              name="visibility"
            >
              <USelectMenu
                v-model="form.visibility"
                class="w-full"
                :items="visibilityOptions"
                value-key="value"
                :placeholder="t('upload_visibility_placeholder')"
              />
            </UFormField>

            <!-- Tags -->
            <UFormField
              :label="t('upload_tags_label')"
              name="tags"
            >
              <div class="space-y-2">
                <div
                  v-if="form.tags.length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <UBadge
                    v-for="(tag, index) in form.tags"
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
                <UInput
                  v-model="tagInput"
                  class="w-full"
                  :placeholder="t('upload_tags_placeholder')"
                  @keydown.enter.prevent="addTag"
                  @keydown="(e: KeyboardEvent) => e.key === ',' && (e.preventDefault(), addTag())"
                />
              </div>
            </UFormField>

            <!-- Submit -->
            <div class="flex gap-3">
              <UButton
                type="submit"
                :loading="uploading"
                :disabled="selectedFiles.length === 0"
              >
                {{ selectedFiles.length === 1 ? t('upload_button', { count: selectedFiles.length }) : t('upload_button_plural', { count: selectedFiles.length }) }}
              </UButton>
              <UButton
                color="neutral"
                variant="outline"
                @click="navigateTo(localePath('/admin/photos'))"
              >
                {{ t('upload_cancel') }}
              </UButton>
            </div>
          </div>
        </UForm>
      </UCard>
    </UPageBody>
  </div>
</template>

<script setup lang="ts">
import { useAlbumsStore } from "~/stores/albums"

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const albumsStore = useAlbumsStore()
await albumsStore.fetchAlbums()

const uploadedFiles = ref<File[] | null>(null)
const selectedFiles = ref<Array<{ file: File, preview: string, name: string }>>([])
const uploading = ref(false)
const tagInput = ref("")

const albumOptions = computed(() =>
  albumsStore.albums.map(album => ({
    label: album.title,
    value: album.id,
  })),
)

const visibilityOptions = computed(() => [
  { label: t("upload_visibility_public"), value: "public" },
  { label: t("upload_visibility_private"), value: "private" },
  { label: t("upload_visibility_password"), value: "password" },
])

const form = reactive({
  albumIds: [] as string[],
  tags: [] as string[],
  visibility: "public",
})

// Preselect album if albumId is in query params
onMounted(() => {
  const albumId = route.query.albumId as string
  if (albumId && !form.albumIds.includes(albumId)) {
    form.albumIds.push(albumId)
  }
})

watch(uploadedFiles, async (files) => {
  if (!files)
    return

  selectedFiles.value.forEach(({ preview }) => {
    if (preview)
      URL.revokeObjectURL(preview)
  })
  selectedFiles.value = []

  const rawExtensions = [".cr2", ".cr3", ".nef", ".arw", ".dng", ".raf", ".orf", ".rw2", ".pef", ".srw"]

  for (const file of files) {
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ""
    const isRaw = rawExtensions.includes(fileExtension)

    let preview = ""

    if (isRaw) {
      // Extract embedded JPEG from RAW file via server endpoint
      try {
        const formData = new FormData()
        formData.append("file", file)

        const blob = await $fetch<Blob>("/api/v1/photos/extract-thumbnail", {
          method: "POST",
          body: formData,
          responseType: "blob",
        })

        preview = URL.createObjectURL(blob)
      } catch (error) {
        console.error("Failed to extract RAW thumbnail:", error)
        preview = ""
      }
    } else {
      // Regular images, create object URL for preview
      preview = URL.createObjectURL(file)
    }

    selectedFiles.value.push({ file, preview, name: file.name })
  }
})

function removeAll() {
  selectedFiles.value.forEach(({ preview }) => {
    if (preview)
      URL.revokeObjectURL(preview)
  })
  selectedFiles.value = []
  uploadedFiles.value = null
}

function removeFile(index: number) {
  const item = selectedFiles.value[index]
  if (!item)
    return
  if (item.preview)
    URL.revokeObjectURL(item.preview)
  selectedFiles.value.splice(index, 1)
  uploadedFiles.value = selectedFiles.value.length > 0 ? selectedFiles.value.map(f => f.file) : null
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  tagInput.value = ""
}

function removeTag(index: number) {
  form.tags.splice(index, 1)
}

async function onCreateAlbum(title: string) {
  try {
    const newAlbum = await $fetch("/api/v1/albums", {
      method: "POST",
      body: {
        title,
        description: "",
        visibility: "public",
      },
    })

    albumsStore.addAlbum({
      ...newAlbum,
      coverPhoto: null,
      _count: { photos: 0 },
      createdAt: new Date(newAlbum.createdAt),
      updatedAt: new Date(newAlbum.updatedAt),
    })

    if (!form.albumIds.includes(newAlbum.id)) {
      form.albumIds.push(newAlbum.id)
    }

    return newAlbum.id
  } catch (error) {
    console.error("Failed to create album:", error)
    return null
  }
}

async function onSubmit() {
  if (selectedFiles.value.length === 0)
    return

  uploading.value = true
  const toast = useToast()
  let successCount = 0
  let duplicateCount = 0
  let errorCount = 0
  const filesToRemove: number[] = []

  try {
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const item = selectedFiles.value[i]
      if (!item)
        continue
      const { file, name } = item
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", name.replace(/\.[^/.]+$/, "")) // Remove extension
      formData.append("albumIds", JSON.stringify(form.albumIds))
      formData.append("visibility", form.visibility)
      formData.append("tags", JSON.stringify(form.tags))

      try {
        await $fetch("/api/v1/photos/upload", {
          method: "POST",
          body: formData,
        })
        successCount++
        filesToRemove.push(i)
      } catch (error: any) {
        console.error("Upload error:", error)
        const statusCode = error.statusCode || error.response?.status

        if (statusCode === 409) {
          // Duplicate file
          duplicateCount++
          toast.add({
            title: t("upload_duplicate_title"),
            description: t("upload_duplicate_message", { name }),
            color: "warning",
            icon: "lucide:circle-alert",
          })
        } else {
          errorCount++
          toast.add({
            title: t("upload_error_title"),
            description: t("upload_error_message", { name }),
            color: "error",
            icon: "lucide:circle-x",
          })
        }
      }
    }

    // Remove successfully uploaded files from the list
    for (let i = filesToRemove.length - 1; i >= 0; i--) {
      const index = filesToRemove[i]
      if (index !== undefined && selectedFiles.value[index]) {
        const preview = selectedFiles.value[index].preview
        if (preview)
          URL.revokeObjectURL(preview)
        selectedFiles.value.splice(index, 1)
      }
    }

    // Update the file input
    if (filesToRemove.length > 0) {
      uploadedFiles.value = selectedFiles.value.length > 0 ? selectedFiles.value.map(f => f.file) : null
    }

    if (successCount > 0) {
      toast.add({
        title: t("upload_success_title"),
        description: t("upload_success_message", { count: successCount }),
        color: "success",
        icon: "lucide:circle-check",
      })
    }

    if (errorCount === 0 && duplicateCount === 0) {
      const albumSlug = route.query.albumSlug as string
      if (albumSlug) {
        navigateTo(localePath(`/admin/albums/${albumSlug}`))
      } else {
        navigateTo(localePath("/admin/photos"))
      }
    }
  } finally {
    uploading.value = false
  }
}

onUnmounted(() => {
  selectedFiles.value.forEach(({ preview }) => {
    if (preview)
      URL.revokeObjectURL(preview)
  })
})
</script>

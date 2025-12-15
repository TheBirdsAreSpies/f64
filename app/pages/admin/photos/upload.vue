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
                  accept="image/*"
                  :preview="true"
                />
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

watch(uploadedFiles, (files) => {
  if (!files)
    return

  selectedFiles.value.forEach(({ preview }) => URL.revokeObjectURL(preview))
  selectedFiles.value = []

  for (const file of files) {
    const preview = URL.createObjectURL(file)
    selectedFiles.value.push({ file, preview, name: file.name })
  }
})

function removeAll() {
  selectedFiles.value.forEach(({ preview }) => URL.revokeObjectURL(preview))
  selectedFiles.value = []
  uploadedFiles.value = null
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

  try {
    for (const { file, name } of selectedFiles.value) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", name.replace(/\.[^/.]+$/, "")) // Remove extension
      formData.append("albumIds", JSON.stringify(form.albumIds))
      formData.append("visibility", form.visibility)
      formData.append("tags", JSON.stringify(form.tags))

      await $fetch("/api/v1/photos/upload", {
        method: "POST",
        body: formData,
      })
    }

    navigateTo(localePath("/admin/photos"))
  } catch (error) {
    console.error("Upload failed:", error)
  } finally {
    uploading.value = false
  }
}

onUnmounted(() => {
  selectedFiles.value.forEach(({ preview }) => URL.revokeObjectURL(preview))
})
</script>

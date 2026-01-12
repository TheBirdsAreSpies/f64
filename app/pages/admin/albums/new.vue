<template>
  <div>
    <UPageHeader
      :title="t('admin_albums_create')"
      :description="t('admin_albums_create_description')"
    />

    <UPageBody>
      <UCard>
        <UForm
          :state="form"
          :validate="validate"
          @submit="onSubmit"
        >
          <div class="space-y-4">
            <UFormField
              :label="t('admin_albums_field_title')"
              name="title"
              required
            >
              <UInput
                v-model="form.title"
                :placeholder="t('admin_albums_field_title_placeholder')"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="t('admin_albums_field_description')"
              name="description"
            >
              <UTextarea
                v-model="form.description"
                :placeholder="t('admin_albums_field_description_placeholder')"
                :rows="4"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="t('admin_albums_field_slug')"
              name="slug"
              :hint="t('admin_albums_field_slug_hint')"
            >
              <UInput
                v-model="form.slug"
                :placeholder="t('admin_albums_field_slug_placeholder')"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="t('admin_albums_field_visibility')"
              name="visibility"
            >
              <USelectMenu
                v-model="form.visibility"
                :items="visibilityOptions"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="form.visibility === 'password'"
              :label="t('admin_albums_field_password')"
              name="password"
              required
            >
              <UInput
                v-model="form.password"
                type="password"
                :placeholder="t('admin_albums_field_password_placeholder')"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="t('admin_albums_field_tags')"
              name="tags"
              :hint="t('admin_albums_field_tags_hint')"
            >
              <div class="space-y-2">
                <div
                  v-if="form.tags && form.tags.length > 0"
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
                <UInputMenu
                  v-model="tagInput"
                  :items="tagSuggestions"
                  :placeholder="t('admin_albums_field_tags_placeholder')"
                  class="w-full"
                  @keydown.enter.prevent="addTag"
                  @update:model-value="(value) => { if (tagSuggestions.includes(value)) addTag() }"
                />
              </div>
            </UFormField>

            <div class="flex gap-3 pt-4">
              <UButton
                color="neutral"
                variant="subtle"
                :to="localePath('/admin/albums')"
              >
                {{ t('admin_albums_cancel') }}
              </UButton>
              <UButton
                type="submit"
                :loading="loading"
              >
                {{ t('admin_albums_create_button') }}
              </UButton>
            </div>
          </div>
        </UForm>
      </UCard>
    </UPageBody>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
})

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const router = useRouter()
const albumsStore = useAlbumsStore()

const form = reactive({
  title: "",
  description: "",
  slug: "",
  visibility: "public" as "public" | "private" | "password",
  password: "",
  tags: [] as string[],
})

const tagInput = ref("")
const loading = ref(false)

const { data: allTags } = await useFetch<{ tags: Array<{ id: string, name: string }> }>("/api/v1/tags", {
  query: { limit: 1000 },
})

const tagSuggestions = computed(() => {
  if (!allTags.value?.tags)
    return []
  return allTags.value.tags
    .filter(tag => !form.tags.includes(tag.name))
    .map(tag => tag.name)
})

const visibilityOptions = computed(() => [
  { value: "public", label: t("admin_albums_visibility_public") },
  { value: "private", label: t("admin_albums_visibility_private") },
  { value: "password", label: t("admin_albums_visibility_password") },
])

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

function validate() {
  const errors = []

  if (!form.title.trim()) {
    errors.push({ path: "title", message: t("admin_albums_error_title_required") })
  }

  if (form.visibility === "password" && !form.password) {
    errors.push({ path: "password", message: t("admin_albums_error_password_required") })
  }

  return errors
}

async function onSubmit() {
  loading.value = true

  try {
    const payload: any = {
      title: form.title,
      description: form.description || undefined,
      slug: form.slug || undefined,
      visibility: form.visibility,
      tags: form.tags.length > 0 ? form.tags : undefined,
    }

    if (form.visibility === "password" && form.password) {
      payload.password = form.password
    }

    const response = await $fetch("/api/v1/albums", {
      method: "POST",
      body: payload,
    })

    albumsStore.addAlbum({
      id: response.id,
      title: response.title,
      slug: response.slug,
      description: response.description,
      visibility: response.visibility,
      coverPhoto: null,
      tags: response.tags || [],
      _count: { photos: 0 },
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    })

    toast.add({
      title: t("admin_albums_created"),
      color: "primary",
    })

    router.push(localePath(`/admin/albums/${response.slug}`))
  } catch (error: any) {
    console.error("Error creating album:", error)
    toast.add({
      title: t("admin_albums_create_failed"),
      description: error?.data?.message || error?.message || t("admin_albums_create_failed_description"),
      color: "error",
    })
  } finally {
    loading.value = false
  }
}
</script>

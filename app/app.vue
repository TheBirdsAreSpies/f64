<template>
  <UApp :locale="locales[locale]">
    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
  </UApp>
</template>

<script setup lang="ts">
import * as locales from "@nuxt/ui/locale"

const { locale } = useI18n()

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

useHead({
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ],
  link: [
    { rel: "icon", href: "/favicon.ico" },
  ],
  htmlAttrs: {
    lang,
    dir,
  },
})

const title = "ƒ/64"
const description = "Upload and manage your photos with ease."

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  // ogImage: "https://ui.nuxt.com/assets/templates/nuxt/starter-light.png",
  // twitterImage: "https://ui.nuxt.com/assets/templates/nuxt/starter-light.png",
  // twitterCard: "summary_large_image",
})
</script>

<template>
  <UDropdownMenu :items="languageMenuItems">
    <UButton
      color="neutral"
      variant="ghost"
      :label="currentLanguageLabel"
      :leading-icon="currentLanguageIcon"
      trailing-icon="lucide:chevron-down"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n()

const currentLanguageLabel = computed(() => {
  switch (locale.value) {
    case "de":
      return t("lang_german")
    default:
      return t("lang_english")
  }
})

const languageMenuItems = computed(() => [
  [
    { label: t("lang_english"), icon: "circle-flags:gb", onSelect: () => setLocale("en") },
    { label: t("lang_german"), icon: "circle-flags:de", onSelect: () => setLocale("de") },
  ],
])

const currentLanguageIcon = computed(() => {
  switch (locale.value) {
    case "de":
      return "circle-flags:de"
    default:
      return "circle-flags:gb"
  }
})
</script>

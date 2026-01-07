<template>
  <div>
    <UHeader>
      <template #title>
        <NuxtLink
          to="/"
          class="flex items-center gap-3"
        >
          <AppLogo />
          <span class="text-2xl font-bold">ƒ/64</span>
        </NuxtLink>
      </template>

      <template #right>
        <AuthState>
          <template #default="{ user }">
            <UDropdownMenu
              v-if="user"
              :items="getDropdownItems(user)"
            >
              <UButton
                color="neutral"
                variant="ghost"
                :label="`${user.firstName} ${user.lastName}`"
                trailing-icon="lucide:chevron-down"
              />
            </UDropdownMenu>
            <div
              v-else
              class="flex gap-2"
            >
              <UButton
                to="/login"
                color="neutral"
                variant="ghost"
              >
                {{ $t('nav_login') }}
              </UButton>
              <UButton to="/register">
                {{ $t('nav_register') }}
              </UButton>
            </div>
          </template>
        </AuthState>
      </template>
    </UHeader>

    <!-- Page Content -->
    <div class="container mx-auto px-4 py-6">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()

const roles = ref<string[] | null>(null)
const session = useUserSession()

watch(
  () => session.user,
  async (u) => {
    if (!u) {
      roles.value = null
      return
    }
    try {
      const res = await $fetch("/api/v1/me/permissions")
      roles.value = Array.isArray(res?.roles) ? res.roles : []
    } catch {
      roles.value = []
    }
  },
  { immediate: true },
)

function getDropdownItems(_user: any) {
  const items: any[] = []

  const isAdmin = !!roles.value?.includes("admin")
  if (isAdmin) {
    items.push([{ label: t("nav_admin"), to: localePath("/admin"), icon: "lucide:settings" }])
  }

  items.push([
    {
      label: t("nav_logout"),
      icon: "lucide:log-out",
      onSelect: async () => {
        await session.clear()
        await navigateTo(localePath("/"))
      },
    },
  ])

  return items
}
</script>

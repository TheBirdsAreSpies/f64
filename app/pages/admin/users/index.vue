<template>
  <div class="space-y-6">
    <UPageHeader
      :title="t('admin_users_title')"
      :description="t('admin_users_description')"
    />

    <UPageBody>
      <!-- Search -->
      <div class="mb-6">
        <UInput
          v-model="search"
          :placeholder="t('admin_users_search_placeholder')"
          icon="lucide:search"
          size="lg"
        />
      </div>

      <!-- Users Table -->
      <UTable
        :data="(usersData?.users ?? [])"
        :columns="columns"
        :loading="pending"
      />
    </UPageBody>

    <!-- Edit User Modal -->
    <UModal
      v-model:open="isEditModalOpen"
      :title="t('admin_users_edit_title')"
    >
      <template #body>
        <div
          v-if="selectedUser"
          class="space-y-6"
        >
          <!-- User Info (Read-only) -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('admin_users_field_name') }}
              </label>
              <p class="text-gray-900 dark:text-white">
                {{ selectedUser.firstName }} {{ selectedUser.lastName }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('admin_users_field_email') }}
              </label>
              <p class="text-gray-900 dark:text-white">
                {{ selectedUser.email }}
              </p>
            </div>
          </div>

          <!-- Email Verification -->
          <div class="border-t border-gray-200 dark:border-gray-800 pt-6">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('admin_users_field_verified') }}
                </label>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t('admin_users_field_verified_desc') }}
                </p>
              </div>
              <USwitch v-model="editFormData.emailVerified" />
            </div>
          </div>

          <!-- Roles -->
          <div class="border-t border-gray-200 dark:border-gray-800 pt-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              {{ t('admin_users_field_roles') }}
            </label>
            <div class="space-y-3">
              <div
                v-for="role in availableRoles"
                :key="role.id"
                class="flex items-center"
              >
                <UCheckbox
                  :model-value="editFormData.roleIds.includes(role.id)"
                  @update:model-value="toggleRole(role.id)"
                />
                <label class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  {{ role.name }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-3">
          <UButton
            color="primary"
            :loading="isSaving"
            @click="saveUser"
          >
            {{ t('common_save') }}
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            @click="isEditModalOpen = false"
          >
            {{ t('common_cancel') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :title="t('admin_users_delete_title')"
    >
      <template #body>
        <p
          v-if="selectedUser"
          class="text-gray-700 dark:text-gray-300"
        >
          {{ t('admin_users_delete_confirm', { name: `${selectedUser.firstName} ${selectedUser.lastName}` }) }}
        </p>
      </template>

      <template #footer>
        <div class="flex gap-3">
          <UButton
            color="error"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            {{ t('admin_users_delete_confirm_button') }}
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            @click="isDeleteModalOpen = false"
          >
            {{ t('common_cancel') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { h, resolveComponent } from "vue"

const UBadge = resolveComponent("UBadge")
const UButton = resolveComponent("UButton")

const { t, locale } = useI18n()
const toast = useToast()

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
})

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
  createdAt: string
  roles: Array<{ id: string, name: string }>
}

interface Role {
  id: string
  name: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const search = ref("")
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
})

const selectedUser = ref<User | null>(null)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const editFormData = reactive({
  emailVerified: false,
  roleIds: [] as string[],
})

const availableRoles = ref<Role[]>([])

const columns: TableColumn<User>[] = [
  {
    accessorKey: "firstName",
    header: t("admin_users_col_name"),
    cell: ({ row }) => {
      const user = row.original
      return h("div", { class: "flex items-center gap-3" }, [
        h("div", { class: "w-10 h-10 rounded-full bg-linear-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-semibold text-sm shrink-0" }, getInitials(user.firstName, user.lastName)),
        h("div", {}, [
          h("p", { class: "font-medium text-gray-900 dark:text-white" }, `${user.firstName} ${user.lastName}`),
        ]),
      ])
    },
  },
  {
    accessorKey: "email",
    header: t("admin_users_col_email"),
  },
  {
    accessorKey: "emailVerified",
    header: t("admin_users_col_verified"),
    cell: ({ row }) => {
      const user = row.original
      return h(UBadge, {
        color: user.emailVerified ? "success" : "error",
        size: "sm",
      }, () => user.emailVerified ? t("admin_users_verified") : t("admin_users_unverified"))
    },
  },
  {
    accessorKey: "roles",
    header: t("admin_users_col_roles"),
    cell: ({ row }) => {
      const user = row.original
      return h("div", { class: "flex flex-wrap gap-2" }, [
        user.roles.length > 0
          ? user.roles.map(role =>
              h(UBadge, {
                key: role.id,
                color: "primary",
                variant: "subtle",
                size: "sm",
              }, () => role.name),
            )
          : h("span", { class: "text-gray-500 text-sm" }, t("admin_users_no_roles")),
      ])
    },
  },
  {
    accessorKey: "createdAt",
    header: t("admin_users_col_joined"),
    cell: ({ row }) => {
      const user = row.original
      return h("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, formatDate(user.createdAt))
    },
  },
  {
    id: "actions",
    header: t("admin_users_col_actions"),
    cell: ({ row }) => {
      const user = row.original
      return h("div", { class: "flex items-center justify-end gap-2" }, [
        h(UButton, {
          icon: "lucide:pencil",
          color: "neutral",
          variant: "ghost",
          size: "sm",
          onClick: () => editUser(user),
        }),
        h(UButton, {
          icon: "lucide:trash-2",
          color: "error",
          variant: "ghost",
          size: "sm",
          onClick: () => deleteUser(user),
        }),
      ])
    },
  },
]

const { data: usersData, pending: _pending } = useFetch<UsersResponse>(() => {
  const params = new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    ...(search.value && { search: search.value }),
  })
  return `/api/v1/admin/users?${params}`
})

const pending = computed(() => _pending.value)

onMounted(async () => {
  try {
    const roles = await $fetch<Role[]>("/api/v1/admin/roles")
    availableRoles.value = roles
  } catch (_error) {
    console.error("Failed to fetch roles:", _error)
  }
})

watch(search, () => {
  pagination.page = 1
})

function getInitials(firstName: string, lastName: string): string {
  const first = (firstName ?? "")?.[0] ?? ""
  const last = (lastName ?? "")?.[0] ?? ""
  return (first + last).toUpperCase() || "?"
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(locale.value, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function editUser(user: User): void {
  selectedUser.value = user
  editFormData.emailVerified = user.emailVerified
  editFormData.roleIds = user.roles.map(r => r.id)
  isEditModalOpen.value = true
}

function toggleRole(roleId: string): void {
  const index = editFormData.roleIds.indexOf(roleId)
  if (index > -1) {
    editFormData.roleIds.splice(index, 1)
  } else {
    editFormData.roleIds.push(roleId)
  }
}

async function saveUser(): Promise<void> {
  if (!selectedUser.value)
    return

  isSaving.value = true
  try {
    await $fetch(`/api/v1/admin/users/${selectedUser.value.id}`, {
      method: "PATCH",
      body: {
        emailVerified: editFormData.emailVerified,
        roleIds: editFormData.roleIds,
      },
    })

    toast.add({
      title: t("toast_success"),
      description: t("admin_users_updated"),
      color: "success",
    })

    isEditModalOpen.value = false
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...(search.value && { search: search.value }),
    })
    const updated = await $fetch<UsersResponse>(`/api/v1/admin/users?${params}`)
    if (updated) {
      usersData.value = updated
    }
  } catch {
    toast.add({
      title: t("toast_error"),
      description: t("admin_users_update_failed"),
      color: "error",
    })
  } finally {
    isSaving.value = false
  }
}

function deleteUser(user: User): void {
  selectedUser.value = user
  isDeleteModalOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!selectedUser.value)
    return

  isDeleting.value = true
  try {
    await $fetch(`/api/v1/admin/users/${selectedUser.value.id}`, {
      method: "DELETE",
    })

    toast.add({
      title: t("toast_success"),
      description: t("admin_users_deleted"),
      color: "success",
    })

    isDeleteModalOpen.value = false
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...(search.value && { search: search.value }),
    })
    const updated = await $fetch<UsersResponse>(`/api/v1/admin/users?${params}`)
    if (updated) {
      usersData.value = updated
    }
  } catch {
    toast.add({
      title: t("toast_error"),
      description: t("admin_users_delete_failed"),
      color: "error",
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

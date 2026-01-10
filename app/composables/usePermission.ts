import type { Permission } from "~~/server/types/permissions"

interface PermissionData {
  id: string
  code: string
  name: string
  category: string
  description: string
}

interface PermissionsResponse {
  success: boolean
  userId: string
  roles: string[]
  permissions: PermissionData[]
}

const permissionsState = ref<PermissionsResponse | null>(null)
const isLoading = ref(false)
const lastError = ref<unknown>(null)

export function usePermissions(): any {
  async function fetchPermissions(force = false): Promise<PermissionsResponse | null> {
    if (permissionsState.value && !force) {
      return permissionsState.value
    }

    isLoading.value = true
    try {
      const data = await $fetch<PermissionsResponse>("/api/v1/me/permissions")
      permissionsState.value = data
      lastError.value = null
      return data
    } catch (error) {
      permissionsState.value = null
      lastError.value = error
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function hasPermission(permission: Permission | string): boolean {
    if (!permissionsState.value) {
      return false
    }
    return permissionsState.value.permissions.some(p => p.code === permission)
  }

  function hasAnyPermission(permissions: (Permission | string)[]): boolean {
    return permissions.some(p => hasPermission(p))
  }

  function hasAllPermissions(permissions: (Permission | string)[]): boolean {
    return permissions.every(p => hasPermission(p))
  }

  function hasRole(role: string): boolean {
    if (!permissionsState.value) {
      return false
    }
    return permissionsState.value.roles.includes(role)
  }

  function clearPermissions(): void {
    permissionsState.value = null
  }

  return {
    permissions: computed(() => permissionsState.value?.permissions ?? []),
    roles: computed(() => permissionsState.value?.roles ?? []),
    isLoading: computed(() => isLoading.value),
    fetchPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    clearPermissions,
    lastError: computed(() => lastError.value),
  }
}

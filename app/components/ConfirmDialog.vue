<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
  >
    <template #body>
      <p class="text-gray-600 dark:text-gray-400">
        {{ message }}
      </p>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        @click="cancel"
      >
        {{ cancelText }}
      </UButton>
      <UButton
        :color="confirmColor"
        @click="confirm"
      >
        {{ confirmText }}
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: "primary" | "error" | "neutral" | "secondary" | "success" | "info" | "warning"
}>(), {
  title: "Confirm",
  confirmText: "Confirm",
  cancelText: "Cancel",
  confirmColor: "primary",
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const isOpen = defineModel<boolean>("open", { required: true })

function confirm() {
  emit("confirm")
  isOpen.value = false
}

function cancel() {
  emit("cancel")
  isOpen.value = false
}
</script>

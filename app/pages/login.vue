<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-4 p-4 h-full bg-primary-50 dark:bg-primary-900/10">
    <UPageCard class="w-full max-w-md p-6 rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90">
      <UAuthForm
        :schema="standardLoginSchema"
        :title="t('login_title')"
        :description="t('login_enter_credentials')"
        icon="lucide:user"
        :fields="StandardLoginFields"
        :ui="{
          root: 'p-6',
          title: 'text-2xl font-bold text-center text-primary',
        }"
        @submit="onSubmitStandard"
      >
        <template #password-hint>
          <UButton
            color="primary"
            variant="link"
            class="font-medium m-0 p-0"
            @click="onForgotPassword"
          >
            {{ t('login_forgot_password') }}
          </UButton>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<script lang="ts" setup>
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui"
import { createStandardLoginSchema } from "~~/shared/schemas/auth.schema"

const { t } = useI18n()
// const toast = useToast()

const standardLoginSchema = computed(() =>
  createStandardLoginSchema(t),
)

const StandardLoginFields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: t("login_email"),
    placeholder: t("login_email_placeholder"),
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: t("login_password"),
    placeholder: t("login_password_placeholder"),
    required: true,
  },
]

async function onSubmitStandard(payload: FormSubmitEvent<any>) {
  const result = await $fetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: payload.data.email,
      password: payload.data.password,
    }),
  })
  if (!result) {
    console.error("Login failed")
    return
  }

  const session = useUserSession()
  await session.fetch()
  navigateTo("/protected")
}

function onForgotPassword() {
  // TODO implement
  // toast.add({
  //   title: t("login_forgot_password"),
  //   description: "TODO: Implement",
  //   color: "info",
  // })
}
</script>

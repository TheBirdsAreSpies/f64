// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/hints",
    "@nuxt/image",
    "nuxt-auth-utils",
    "@nuxtjs/i18n",
  ],
  devtools: {
    enabled: true,
  },
  css: ["~/assets/css/main.css"],
  routeRules: {
    "/": { prerender: true },
  },
  compatibilityDate: "2025-01-15",
  i18n: {
    defaultLocale: "en",
    locales: [{
      code: "de",
      name: "Deutsch",
      file: "de.json",
    }, {
      code: "en",
      name: "English",
      file: "en.json",
    }, {
      code: "fr",
      name: "Français",
    }],
  },
})

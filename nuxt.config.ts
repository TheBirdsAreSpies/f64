/* eslint-disable node/prefer-global/process */
// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from "./package.json" assert { type: "json" }

const buildTime = new Date().toISOString()

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/hints",
    "@nuxt/image",
    "nuxt-auth-utils",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
  ],
  devtools: {
    enabled: true,
  },
  devServer: {
    host: "0.0.0.0",
  },
  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || "http://localhost:3000",
    },
  },
  vite: {
    define: {
      "import.meta.env.PACKAGE_VERSION": JSON.stringify(pkg.version),
      "import.meta.env.BUILD_TIME": JSON.stringify(buildTime),
    },
  },
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2025-01-15",
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: [],
    },
  },
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

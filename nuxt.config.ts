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
  image: {
    provider: "ipx",
  },
  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || "http://localhost:3000",
    },
    session: {
      name: import.meta.env.NUXT_SESSION_NAME || "f64_session",
      password: import.meta.env.NUXT_SESSION_PASSWORD,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      },
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
    publicAssets: [
      {
        dir: "/app/public",
        maxAge: 60 * 60 * 24 * 7,
      },
    ],
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
    }],
  },
})

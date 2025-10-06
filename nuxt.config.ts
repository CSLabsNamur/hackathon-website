// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {enabled: true},

  modules: [
    "@nuxt/eslint",
    "@nuxt/scripts",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/fonts",
  ],

  css: ["~/assets/css/main.css"],
  fonts: {
    provider: "local",
  },

  routeRules: {
    "/api/**": {proxy: process.env.API_URL},
  },
});

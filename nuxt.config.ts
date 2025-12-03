// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {enabled: true},

  // TODO: Remove when Nuxt fix 4.2.0 (https://github.com/nuxt/nuxt/issues/33582)
  //hooks: {
  //  "vite:extendConfig": extendViteConfig,
  //},

  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxt/scripts",
    "@nuxtjs/mdc",
    "@nuxt/content",
    "dayjs-nuxt",
    "@vueuse/nuxt",
    "nuxt-echarts",
    "@nuxtjs/device",
    "@nuxtjs/supabase",
    "@pinia/nuxt",
  ],

  postcss: {
    plugins: {
      "postcss-nesting": {},
    },
  },

  css: ["~/assets/css/main.css"],
  fonts: {
    provider: "local",
  },
  icon: {
    mode: "css",
  },
  ui: {
    experimental: {
      componentDetection: true,
    },
  },

  runtimeConfig: {
    public: {
      teaserEnabled: false,
      eventDateStart: "",
      eventDateEnd: "",
      registrationsDateOpen: "",
      registrationsDateClose: "",
      eventTitle: "Le Hackathon du CSLabs",
      eventSlogan: "",
    },
  },

  supabase: {
    types: false,
    redirect: false,
    redirectOptions: {
      login: "/auth/login",
      callback: "/auth/callback",
    },
  },

  dayjs: {
    locales: ["fr"],
    defaultLocale: "fr",
    defaultTimezone: "Europe/Brussels",
    plugins: ["timezone", "utc", "duration", "isBetween", "relativeTime"],
  },

  echarts: {
    renderer: ["svg", "canvas"],
    charts: ["LineChart", "PieChart"],
    components: ["AriaComponent", "DatasetComponent", "TooltipComponent", "GridComponent", "TitleComponent"],
    features: ["LabelLayout", "UniversalTransition"],
  },
});

// TODO: Remove when Nuxt fix 4.2.0 (https://github.com/nuxt/nuxt/issues/33582)
//function extendViteConfig(config: import("vite").UserConfig) {
//  const plugin = config.plugins?.find(plugin => isPlugin(plugin, "nuxt:environments"));
//  if (plugin) plugin.enforce = "pre";
//}
//
//function isPlugin(plugin: unknown, name: string): plugin is import("vite").Plugin {
//  return !!(plugin && typeof plugin === "object" && "name" in plugin && plugin.name === name);
//}
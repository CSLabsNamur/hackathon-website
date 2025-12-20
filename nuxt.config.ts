// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {enabled: true},

  // TODO: Delete when fixed https://github.com/prisma/prisma/issues/28804
  nitro: {
    rollupConfig: {
      external: [/^@prisma\//, /\.wasm$/],
    },
  },

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
    "@nuxtjs/turnstile",
    "nuxt-nodemailer",
  ],

  // TODO: Is this still necessary?
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
    turnstile: {
      secretKey: "",
    },
  },

  supabase: {
    types: false,
    redirect: true,
    redirectOptions: {
      login: "/",
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

  turnstile: {
    siteKey: process.env.NUXT_TURNSTILE_SITE_KEY,
  },

  nodemailer: {
    from: "\"Hackathon CSLabs\" <hackathon@cslabs.be>",
    host: process.env.NUXT_SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.NUXT_SMTP_USER,
      pass: process.env.NUXT_SMTP_PASSWORD,
    },
    replyTo: process.env.NUXT_SMTP_REPLY_TO || "event@cslabs.be",
  },
});
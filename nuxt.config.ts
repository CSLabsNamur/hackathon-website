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
    "nuxt-security",
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

  routeRules: {
    "/": {swr: 3600},
    "/devenir-partenaire": {swr: 3600},
    "/infos": {
      swr: 1800,
      security: {
        headers: {
          crossOriginEmbedderPolicy: "unsafe-none",
        },
      },
    },
    "/partenaires": {swr: 1800},
    "/plus-loin": {swr: 3600},
    "/historique": {static: true},
    "/cookie-policy": {static: true},
    "/admin/**": {ssr: false},
    "/participant/**": {ssr: false},
    "/auth/**": {ssr: false},
  },

  security: {
    csrf: true,
    corsHandler: {
      origin: ["http://localhost:3000", "https://hackathon.cslabs.be", process.env.SUPABASE_URL || ""],
    },
    headers: {
      contentSecurityPolicy: {
        "img-src": ["'self'", "data:", "https://api.dicebear.com", `https://${new URL(process.env.SUPABASE_URL || "").host}`, "https://lh3.googleusercontent.com"],
        "connect-src": ["'self'", `https://${new URL(process.env.SUPABASE_URL || "").host}`, `wss://${new URL(process.env.SUPABASE_URL || "").host}`],
        "frame-src": ["'self'", "https://challenges.cloudflare.com", "https://www.openstreetmap.org"],
        "script-src-attr": ["'unsafe-hashes'", "'unsafe-inline'"],
      },
    },
    requestSizeLimiter: {
      maxUploadFileRequestInBytes: 5 * 1024 * 1024, // 5MB
    },
  },

  supabase: {
    types: false,
    // We handle auth redirects ourselves to check user role
    redirect: false,
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
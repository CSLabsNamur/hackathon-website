import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Hackathon Docs",
  description: "Developer documentation for the Hackathon platform",
  lang: "en-BE",
  lastUpdated: true,
  base: "/",
  sitemap: {
    hostname: "https://docs.hackathon.cslabs.be",
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: "local",
    },
    nav: [
      {text: "Onboarding", link: "/onboarding/"},
      {text: "Architecture", link: "/architecture/"},
      {text: "Frontend", link: "/frontend/"},
      {text: "Backend", link: "/backend/"},
      {text: "Operations", link: "/operations/"},
      {text: "ADRs", link: "/adrs/"},
    ],
    sidebar: {
      "/onboarding/": [
        {
          text: "Onboarding",
          items: [
            {text: "Overview", link: "/onboarding/"},
            {text: "Local Setup", link: "/onboarding/local-setup"},
            {text: "Environment", link: "/onboarding/environment"},
          ],
        },
      ],
      "/architecture/": [
        {
          text: "Architecture",
          items: [
            {text: "Overview", link: "/architecture/"},
            {text: "Runtime Overview", link: "/architecture/runtime-overview"},
            {text: "Auth & RBAC", link: "/architecture/auth-rbac"},
            {text: "Data Model", link: "/architecture/data-model"},
          ],
        },
      ],
      "/frontend/": [
        {
          text: "Frontend",
          items: [
            {text: "Overview", link: "/frontend/"},
          ],
        },
      ],
      "/backend/": [
        {
          text: "Backend",
          items: [
            {text: "Overview", link: "/backend/"},
            {text: "API", link: "/backend/api"},
          ],
        },
      ],
      "/operations/": [
        {
          text: "Operations",
          items: [
            {text: "Overview", link: "/operations/"},
          ],
        },
      ],
      "/adrs/": [
        {
          text: "ADRs",
          items: [
            {text: "Overview", link: "/adrs/"},
            {text: "Nuxt", link: "/adrs/nuxt"},
            {text: "Prisma", link: "/adrs/prisma"},
            {text: "Supabase", link: "/adrs/supabase"},
          ],
        },
      ],
    },
    socialLinks: [
      {icon: "github", link: "https://github.com/CSLabsNamur/hackathon-website/"},
    ],
    outline: "deep",
  },
});

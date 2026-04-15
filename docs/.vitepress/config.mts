import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "CSLabs Hackathon Docs",
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
      {text: "Home", link: "/"},
      {text: "Examples", link: "/markdown-examples"},
    ],

    sidebar: [
      {
        text: "Examples",
        items: [
          {text: "Markdown Examples", link: "/markdown-examples"},
          {text: "Runtime API Examples", link: "/api-examples"},
        ],
      },
    ],

    socialLinks: [
      {icon: "github", link: "https://github.com/vuejs/vitepress"},
    ],
  },
});

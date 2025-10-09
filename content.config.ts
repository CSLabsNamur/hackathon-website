import { defineCollection, defineContentConfig } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      // Specify the type of content in this collection
      type: "page",
      // Load every file inside the `content` directory
      source: "pages/**/*.md",
    }),
  },
});

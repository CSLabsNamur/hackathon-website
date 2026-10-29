import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {name: "unit", include: ["test/unit/**/*.test.ts"], environment: "node"},
      },
      {
        test: {
          name: "integration",
          include: ["test/integration/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
          env: {DATABASE_URL: process.env.TEST_DATABASE_URL ?? ""},
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["test/nuxt/**/*.test.ts"],
          environment: "nuxt",
          environmentOptions: {
            nuxt: {
              overrides: {
                supabase: {url: "https://supabase.example.test", key: "test-key"},
                ogImage: {enabled: false},
                turnstile: {siteKey: "test-key"},
              },
            },
          },
        },
      }),
    ],
  },
});

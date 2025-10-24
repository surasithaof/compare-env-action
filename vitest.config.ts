import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      enabled: true,
      provider: "v8", // or 'istanbul'
      reporter: ["json", "html"],
    },
    reporters: ["default"],
  },
});

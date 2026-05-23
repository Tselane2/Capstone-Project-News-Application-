import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    reporters: ["verbose"],
    // Run test files one at a time to prevent the afterAll cleanup in one file
    // from deleting @test.com users that another file's tests still need.
    fileParallelism: false,
  },
});

import { defineConfig } from "vitest/config";

// Security-rules tests run against the Firestore emulator in a Node environment,
// isolated from the jsdom component-test config. Run with the emulator active:
//   firebase emulators:exec "npm run test:rules"
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/rules/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});

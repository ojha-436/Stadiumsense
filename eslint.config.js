import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dev-dist",
      "functions",
      "simulator",
      "node_modules",
      "coverage",
      "playwright-report",
      "test-results",
      "**/*.config.{js,ts}",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.{ts,tsx}", "test/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // The logger is the one place allowed to touch the console directly — every
    // other module routes through it. Scope the exception here instead of
    // widening the global allow-list.
    files: ["src/lib/logger.ts"],
    rules: { "no-console": "off" },
  },
  {
    files: ["src/**/*.{test,spec}.{ts,tsx}", "src/test/**", "test/**", "scripts/**"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { "no-console": "off" },
  }
);

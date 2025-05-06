import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

import stylisticJs from '@stylistic/eslint-plugin-js'

export default defineConfig([
    { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
    { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.browser } },
    { plugins: { '@stylistic/js': stylisticJs } },
    tseslint.configs.recommended,
    {
        rules: {
            "@stylistic/js/quotes": ["warn", "single"],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
            }],
            "no-console": "warn",
        },
    }
]);

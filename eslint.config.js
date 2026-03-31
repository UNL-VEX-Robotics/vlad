import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
    js.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node, // Enables 'process', '__dirname', etc.
                ...globals.browser, // Keeps browser globals if you have client-side JS
            },
        },
        rules: {
            // --- Error Prevention ---
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }], // Error on unused vars, ignore if they start with _
            "no-undef": "error",
            "require-await": "error", // Critical for your async pool.query calls
            "no-floating-promises": "off", // Set to 'error' if using TypeScript, keep off for standard JS

            // --- Style & Best Practices ---
            "no-var": "error", // Force 'let' or 'const'
            "prefer-const": "error", // Suggests 'const' for variables never reassigned
            eqeqeq: ["error", "always"], // Forces === instead of ==
            curly: "error", // Requires {} for all if/else blocks
            "no-console": "warn", // Warns you to remove console.log before production
        },
    },
    prettierConfig,
];

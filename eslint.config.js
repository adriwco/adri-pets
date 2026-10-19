import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export const domainRestrictions = {
  files: ["src/domain/**/*.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["preact", "preact/*", "react", "react/*", "astro", "astro:*", "@astrojs/*"], message: "domain/ é puro: sem framework." },
          { group: ["**/components/*", "**/viewModels/*", "**/config/*"], message: "domain/ não depende de UI nem de configuração." },
        ],
      },
    ],
    "no-restricted-syntax": [
      "error",
      { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: "domain/ recebe o hoje por parâmetro." },
      { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: "domain/ recebe o hoje por parâmetro." },
      { selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']", message: "domain/ é determinístico." },
    ],
  },
};

export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  domainRestrictions,
  {
    files: ["src/components/**/*", "src/pages/**/*", "src/layouts/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["**/domain/calculateQuote", "**/domain/cardSurcharge"], message: "Componentes usam o ViewModel, não o motor direto." }] },
      ],
    },
  },
);

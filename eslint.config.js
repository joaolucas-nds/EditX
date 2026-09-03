// eslint.config.js
//
// Configuração ESLint (flat config). Substitui o `oxlint` que o
// create-vite instala por padrão hoje — o CONTEXT.md do projeto documenta
// ESLint + Prettier como ferramentas de lint/format, então mantemos essa
// escolha em vez de aceitar o default do scaffold.
//
// Fixado em ^9.0.0: testamos ^10.0.0 (resolveria uma vulnerabilidade de
// DoS em minimatch/brace-expansion) mas o eslint-plugin-react-hooks@5.2.0
// ainda trava o peer dependency em "^9.0.0" — não dá pra ter as duas coisas
// hoje. Ver DEC-011 para o raciocínio completo.
//
// eslint-config-prettier entra por último para desligar qualquer regra do
// ESLint que conflite com a formatação do Prettier (evita o linter e o
// formatter brigarem sobre a mesma linha).

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // `any` é proibido no schema (ver CONTEXT.md § Armadilhas) — elevado a
      // erro em todo o projeto, não só em TemplateSchema.ts, para pegar
      // regressões cedo.
      '@typescript-eslint/no-explicit-any': 'error',
      // Import de tipo isolado (`import type`) evita que tipos puramente
      // estruturais (sem valor em runtime) entrem no bundle final.
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
  prettierConfig,
);

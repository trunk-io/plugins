const eslint = require("@eslint/js");
const typescriptEslint = require('typescript-eslint');
const importPlugin = require('eslint-plugin-import-x');
const parser = require("@typescript-eslint/parser");
const nodeRecommended = require('eslint-plugin-n');
const prettier = require('eslint-config-prettier');

module.exports = [
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
  prettier,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 12,
      parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      ...nodeRecommended.configs.recommended.rules,
      "import-x/first": "error",
    },
    plugins: {
      // TODO(Tyler): Use import, not import-x for this once there is official flat config support
      "import-x": importPlugin,
      "n": nodeRecommended,
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
  }
];

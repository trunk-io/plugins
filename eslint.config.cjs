const eslint = require("@eslint/js");
const typescriptEslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import-x");
const nodeRecommended = require("eslint-plugin-n");
const prettier = require("eslint-config-prettier");
const jestPlugin = require("eslint-plugin-jest");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
// const preferArrowFunctions = require("eslint-plugin-prefer-arrow-functions");

module.exports = [
  eslint.configs.recommended,
  prettier,
  ...typescriptEslint.config({
    files: ["**/*.ts"],
    extends: [
      ...typescriptEslint.configs.recommended,
      ...typescriptEslint.configs.strictTypeChecked,
      ...typescriptEslint.configs.stylisticTypeChecked,
    ],
    plugins: {
      // "prefer-arrow-functions": preferArrowFunctions,
      "simple-import-sort": simpleImportSort,
      "import-x": importPlugin,
      n: nodeRecommended,
    },
    languageOptions: {
      ecmaVersion: "latest",
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: "module",
        project: "tsconfig.json",
      },
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      ...nodeRecommended.configs.recommended.rules,
      "no-return-await": "off",
      "no-shadow": "off",
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
      "no-use-before-define": "off",
      "no-useless-constructor": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "function", format: ["camelCase"] },
        {
          selector: "variable",
          modifiers: ["global", "const"],
          format: ["UPPER_CASE", "camelCase"],
        },
      ],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-expressions": ["error"],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-use-before-define": ["error"],
      "@typescript-eslint/no-useless-constructor": ["error"],
      "@typescript-eslint/no-explicit-any": "off",
      "class-methods-use-this": "off",
      curly: "error",
      "func-names": ["error", "as-needed"],
      "func-style": ["error", "expression", { allowArrowFunctions: true }],
      "import-x/extensions": "off",
      "import-x/first": "error",
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: ["**/*.test.ts", "**/tests/**"],
        },
      ],
      "import-x/no-unresolved": "off",
      "import-x/prefer-default-export": "off",
      "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
      "max-len": [
        "error",
        {
          code: 120,
          comments: 130,
          tabWidth: 2,
          ignoreComments: false,
          ignoreTrailingComments: false,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      "no-continue": "off",
      "no-param-reassign": ["error", { props: false }],
      "no-restricted-syntax": "off",
      "n/no-extraneous-import": ["error"],
      "n/no-unpublished-import": "off",
      "n/no-missing-import": "off",
      "n/no-unsupported-features/es-syntax": ["error", { ignores: ["modules", "dynamicImport"] }],
      // TODO(Tyler): Add prefer-arrow-functions once it becomes compatible.
      // "prefer-arrow-functions/prefer-arrow-functions": [
      //   "error",
      //   {
      //     returnStyle: "implicit",
      //   },
      // ],
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": "error",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
    settings: [
      "error",
      {
        "import-x/resolver": {
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
    ],
  }),
  {
    files: ["**/*test.ts"],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
  },
  {
    // Used for scripts and Trunk Actions.
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      globals: {
        node: true,
        require: true,
        console: true,
        module: true,
        __dirname: true,
      },
      ecmaVersion: "latest",
    },
  },
];

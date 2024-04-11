# Commitlint

https://github.com/conventional-changelog/commitlint

## Simple configuration

1. `echo "export default {extends: ['@commitlint/config-conventional']}" > commitlint.config.mjs`
2. `trunk actions enable commitlint`

This will install the basic config and run commitlint on every `commit-msg` hook.

## Overriding configuration

In order to use different commitlint configuration or specify a specific commitlint version, you
must:

1. Modify your `commitlint.config.mjs` accordingly
2. Override the `packages_file` field for the action and specify a package.json

For example:

`trunk.yaml`:

```yaml
actions:
  enabled:
    - commitlint
  definitions:
    - id: commitlint
      packages_file: ${workspace}/.trunk/commitlint/package.json
```

`commitlint.config.mjs`:

```js
export default {
  extends: ["@commitlint/config-angular", "@commitlint/config-conventional"],
};
```

`.trunk/commitlint/package.json`:

```json
{
  "dependencies": {
    "@commitlint/cli": "^17.0",
    "@commitlint/config-conventional": "^17.0",
    "@commitlint/config-angular": "^17.0"
  }
}
```

# eslint

## Migration Guide

Trunk does not yet support `eslint@9.x`, which includes substantial config format changes (see their
[migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0#flat-config)). If you'd like
to opt-in to `eslint@9.x` with Trunk before we release official support, you can add the following
override to your `.trunk/trunk.yaml`:

```yaml
version: 0.1
---
lint:
  enabled:
    - eslint@9.0.0
  definitions:
    - name: eslint
      direct_configs:
        - eslint.config.js
        - eslint.config.mjs
        - eslint.config.cjs
```

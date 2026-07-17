# toml-tidy

[toml-tidy](https://github.com/AndrewDongminYoo/toml-tidy) sorts TOML keys within each table while preserving table hierarchy, comments, and source formatting.
It complements [taplo](https://github.com/tamasfe/taplo) (formatting) rather than replacing it — the relationship mirrors `prettier` and `sort-package-json` for `package.json`.

toml-tidy requires Python >= 3.12, which is newer than the default hermetic Python runtime, so enable a compatible runtime alongside the linter:

```yaml
runtimes:
  enabled:
    - python@3.12.2
lint:
  enabled:
    - toml-tidy@0.2.0
```

Per-file defaults (sort order, scope, pinned-first tables) can be configured in the nearest `pyproject.toml` under `[tool.toml-tidy]`.

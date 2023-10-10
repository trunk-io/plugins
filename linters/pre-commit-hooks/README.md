# Pre-Commit-Hooks

The set of formatter and linters in this suite are disabled by default. Some of the
linters/formatters have different conflicting outputs.

To enabled, add the list of checks you want in your trunk.yaml as such:

```yaml
lint:
  enabled:
    - pre-commit-hooks@4.4.0:
        commands:
          - end-of-file-fixer
```

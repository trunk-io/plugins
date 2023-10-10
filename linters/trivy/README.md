# Trivy

Trivy has the following subcommands:

- `config`
  - Runs `trivy config`
    ([docs](https://aquasecurity.github.io/trivy/latest/docs/scanner/misconfiguration/)) to scan for
    misconfigurations in infrastructure-as-code files. Enabled by default.
- `fs-vuln`
  - Runs `trivy fs --scanners vuln`
    ([docs](https://aquasecurity.github.io/trivy/latest/docs/target/filesystem/)) to scan for
    security vulnerabilities. Disabled by default.
- `fs-secret`
  - Runs `trivy fs --scanners secret`
    ([docs](https://aquasecurity.github.io/trivy/latest/docs/target/filesystem/)) to scan for
    secrets. Disabled by default.

To enable/disable these, add the subcommands you want enabled in your trunk.yaml as such:

```yaml
lint:
  enabled:
    - trivy@0.45.1:
        commands: [config, fs-vuln]
```

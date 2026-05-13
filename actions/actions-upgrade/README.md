# actions-upgrade

Manual Trunk action: run **pinact** with `--update` on workflow and composite action files under
`.github/`, using the **GitHub API** with a token from **`gh auth token`** when you have not set
`GITHUB_TOKEN` or `GH_TOKEN`.

## Enable

```yaml
actions:
  enabled:
    - actions-upgrade
```

## Run

This action has **no triggers**; invoke it explicitly:

```bash
trunk run actions-upgrade
```

Requires a logged-in GitHub CLI (`gh auth login`) unless you export `GITHUB_TOKEN` or `GH_TOKEN`
first.

## What it updates

- `.github/workflows/*.yml` and `*.yaml`
- `.github/actions/**/action.yml` and `action.yaml`

# ggshield

[GitGuardian CLI](https://docs.gitguardian.com/ggshield-docs/reference/overview) for detecting
hardcoded secrets in your codebase.

## Setup

### Authentication

ggshield requires authentication to run. You can authenticate in one of two ways:

1. **Automatic authentication** (recommended for local development):

   ```bash
   ggshield auth login
   ```

   This opens a browser window for you to log in to your GitGuardian account.

2. **Environment variable** (recommended for CI/CD):
   ```bash
   export GITGUARDIAN_API_KEY=your_api_key
   ```
   You can create a personal access token in your
   [GitGuardian dashboard](https://dashboard.gitguardian.com/).

### Configuration

ggshield can be configured using:

- `.gitguardian.yaml` or `.gitguardian.yml`
- `.ggshield.yaml` or `.ggshield.yml`

See the [GitGuardian documentation](https://docs.gitguardian.com/ggshield-docs/configuration) for
configuration options.

## Usage

Enable ggshield in your repository:

```bash
trunk check enable ggshield
```

## Features

- Scans all files for over 450+ types of hardcoded secrets
- Supports custom exclusion patterns
- Integrates with GitGuardian dashboard for secret management
- Provides detailed remediation guidance

## Best Practices

- Use `--exclude` patterns to skip files unlikely to contain secrets
- Configure `.gitguardian.yaml` to customize scanning behavior
- Set `GITGUARDIAN_API_KEY` environment variable for CI/CD environments
- Review and remediate detected secrets promptly

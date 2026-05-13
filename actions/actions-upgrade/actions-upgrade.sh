#!/usr/bin/env bash
# Upgrade pinned GitHub Actions via pinact, using the GitHub CLI for a token when needed.
set -euo pipefail

workspace="${1:?actions-upgrade: missing workspace argument}"

if [[ -z ${GITHUB_TOKEN-} ]]; then
  if [[ -n ${GH_TOKEN-} ]]; then
    export GITHUB_TOKEN="${GH_TOKEN}"
  else
    if ! command -v gh >/dev/null 2>&1; then
      echo "actions-upgrade: install the GitHub CLI (gh) or set GITHUB_TOKEN or GH_TOKEN" >&2
      exit 1
    fi
    GITHUB_TOKEN="$(gh auth token)"
    export GITHUB_TOKEN
  fi
fi

cd "${workspace}"

targets=()
while IFS= read -r -d '' f; do targets+=("${f}"); done < <(
  find .github/workflows -maxdepth 1 \( -name "*.yml" -o -name "*.yaml" \) -print0 2>/dev/null || true
)
while IFS= read -r -d '' f; do targets+=("${f}"); done < <(
  find .github/actions -type f \( -name "action.yml" -o -name "action.yaml" \) -print0 2>/dev/null || true
)

if [[ ${#targets[@]} -eq 0 ]]; then
  echo "actions-upgrade: no workflow or composite action files found under .github/"
  exit 0
fi

exec pinact run -u "${targets[@]}"

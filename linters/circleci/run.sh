#!/bin/bash
set -euo pipefail

LINT_TARGET="${1}"

circleci --skip-update-check config validate "${LINT_TARGET}" || exit 1

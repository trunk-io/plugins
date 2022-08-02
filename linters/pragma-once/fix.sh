#!/bin/bash
set -euo pipefail

LINT_TARGET="${1}"

# NOTE(sam): implementing this with `batch: true` is a bit non-trivial (impl would be a
# slightly-more-than-trivial awk program that modifies files in place).
if ! grep --quiet '^#pragma once$' "${LINT_TARGET}"; then
  echo "#pragma once"
fi

cat "${LINT_TARGET}"

#!/bin/bash
set -euo pipefail

# Insert "#pragma once" if it wasn't there
# NOTE(sam): implementing this with `batch: true` is a bit non-trivial because bash handling of
# spaces is weird
if ! grep --quiet '^#pragma once$' "${1}"
then
  awk -i inplace 'BEGINFILE{print "#pragma once"}{print}' "${1}"
fi

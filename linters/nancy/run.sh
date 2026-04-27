#!/usr/bin/env bash

set -eu

set -- --output=json --skip-update-check

if [ -n "${OSS_INDEX_USERNAME-}" ] && [ -n "${OSS_INDEX_TOKEN-}" ]; then
  set -- "$@" --username "$OSS_INDEX_USERNAME" --token "$OSS_INDEX_TOKEN"
fi

go list -json -deps ./... | nancy sleuth "$@"

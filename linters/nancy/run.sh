#!/usr/bin/env bash

set -eux

go list -json -deps ./... | nancy sleuth --output=json --skip-update-check

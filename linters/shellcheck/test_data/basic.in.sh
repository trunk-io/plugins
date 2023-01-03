#!/bin/bash

set -euo pipefail

if [ "$(uname)" == "Darwin" ]; then
    platform="mac"
elif [ "$(uname)" == "Linux" ]; then
        platform="linux"
fi

output=$(my current platform is $platform)
echo $output

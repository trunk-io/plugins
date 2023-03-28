#!/bin/bash

set -euo pipefail

key=blame.ignoreRevsFile
file=.git-blame-ignore-revs

if [[ -f ${file} ]]; then
  # File exists, add or overwrite the setting.
  git config "${key}" "${file}"
elif current_config=$(git config "${key}"); then
  if [[ ${current_config} == "${file}" ]]; then
    # File doesn't exist and the key is currently set to that file. Remove the config setting
    # or `git blame` will complain it is missing.
    git config --unset "${key}"
  fi
fi

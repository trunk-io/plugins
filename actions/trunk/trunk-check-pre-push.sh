#!/bin/bash
#
# Lightweight wrapper to call trunk-check with optional interactivity.

# Find the trunk binary.
# TODO: This can be done better by passing the trunk binary path as an environment variable.
if ! trunk="$(command -v trunk)"; then
  set -euo pipefail
  if [[ -f .trunk/bin/trunk && -x .trunk/bin/trunk ]]; then
    trunk=.trunk/bin/trunk
  elif [[ -f tools/trunk && -x tools/trunk ]]; then
    trunk=tools/trunk
  elif [[ -f trunk && -x trunk ]]; then
    trunk=./trunk
  elif [[ -n ${XDG_CACHE_HOME:-} && -f "${XDG_CACHE_HOME}/.cache/trunk/launcher/trunk" && -x "${XDG_CACHE_HOME}/.cache/trunk/launcher/trunk" ]]; then
    trunk="${XDG_CACHE_HOME}/.cache/trunk/launcher/trunk"
  elif [[ -n ${HOME:-} && -f "${HOME}/.cache/trunk/launcher/trunk" && -x "${HOME}/.cache/trunk/launcher/trunk" ]]; then
    trunk="${HOME}/.cache/trunk/launcher/trunk"
  else
    echo "Unable to find trunk binary"
    exit 1
  fi
fi

if [[ -t 0 ]]; then
  # STDIN is TTY; can use interactive prompts.
  echo "Running trunk in interactive mode."
  exec "${trunk}" check -t git-push "$@"
else
  echo "Running trunk in non-interactive mode; if this fails, please try your git or trunk command manually from a terminal."
  exec "${trunk}" check "$@"
fi

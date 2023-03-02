#!/bin/bash
#
# Lightweight wrapper to call trunk-check with optional interactivity.

if [[ -t 0 ]]; then
  # STDIN is TTY; can use interactive prompts.
  trunk check -t git-push "$@"
else
  trunk check "$@"
fi

#!/usr/bin/env python3

# trunk-ignore-begin(ruff)
"""
as of 1.28.2, sarif output looks like this
======================================================
tfsec is joining the Trivy family

tfsec will continue to remain available
for the time being, although our engineering
attention will be directed at Trivy going forward.
You can read more here:
https://github.com/aquasecurity/tfsec/discussions/1994
======================================================
{
  "version": "2.1.0",
  ...
"""
# trunk-ignore-end(ruff)

import sys


def main():
    original_input = sys.stdin.read()
    try:
        index = original_input.index("{")
        print(original_input[index:])
    except ValueError:
        print(original_input)


if __name__ == "__main__":
    main()

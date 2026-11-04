#!/usr/bin/env python3
"""Pass ktlint's SARIF through, and fail when there is none.

ktlint exits 1 both when it reports violations and when it dies before
reporting, for example when the JVM runs out of heap. In the second case it
prints nothing, and Trunk would read the empty output as a clean result, so an
output that is not a SARIF log fails the run instead.

A file that ends inside an unfinished construct gets its parse error one line
past the end of the file, with an empty rule id. Trunk treats a line outside
the file as outside the change and files the issue as existing, so such
results are moved to the last line and named `parse-error`.
"""

import json
import sys
from pathlib import Path

PARSE_ERROR_RULE_ID = "parse-error"


def line_count(uri: str, cache: dict[str, int | None]) -> int | None:
    if uri not in cache:
        try:
            cache[uri] = len(Path(uri).read_text(encoding="utf-8").splitlines())
        except OSError:
            cache[uri] = None
    return cache[uri]


def normalize(sarif: dict) -> None:
    counts: dict[str, int | None] = {}
    for run in sarif["runs"]:
        for result in run.get("results", []):
            if not result.get("ruleId"):
                result["ruleId"] = PARSE_ERROR_RULE_ID
            for location in result.get("locations", []):
                physical = location.get("physicalLocation", {})
                uri = physical.get("artifactLocation", {}).get("uri")
                region = physical.get("region")
                if not uri or not region or "startLine" not in region:
                    continue
                lines = line_count(uri, counts)
                if lines is not None and region["startLine"] > max(lines, 1):
                    region["startLine"] = max(lines, 1)
                    region.pop("startColumn", None)


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: sarif_guard.py <exit code>", file=sys.stderr)
        return 2

    text = sys.stdin.read()
    try:
        sarif = json.loads(text)
    except json.JSONDecodeError:
        print(
            f"ktlint exited {sys.argv[1]} without printing SARIF:\n{text}",
            file=sys.stderr,
        )
        return 1
    if not isinstance(sarif, dict) or not isinstance(sarif.get("runs"), list):
        print(
            f"ktlint exited {sys.argv[1]} with output that is not a SARIF log",
            file=sys.stderr,
        )
        return 1

    normalize(sarif)
    json.dump(sarif, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

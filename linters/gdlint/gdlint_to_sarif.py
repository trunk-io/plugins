#!/usr/bin/env python3
"""Convert gdlint's stderr into SARIF.

gdlint exits 1 both for rule findings and for files it cannot parse, and a
parse failure prints a multi-line block instead of a finding line. Reading only
the finding lines would turn an unparsable file into a clean result, so every
finding and every parse block is counted and checked against the total gdlint
prints in its own summary line. Any mismatch fails the run instead of reporting
fewer issues than gdlint found.
"""

import json
import re
import sys

FINDING = re.compile(
    r"^(?P<path>.+\.gd):(?P<line>\d+): Error: (?P<message>.*) \((?P<rule>[a-z0-9-]+)\)$"
)
PARSE_HEADER = re.compile(r"^(?P<path>\S.*\.gd):$")
# Lark reports "at line 50, column 110" for an unexpected token and
# "at line 1 col 9" for an unexpected character; a dedent error has no position.
PARSE_POSITION = re.compile(r"at line (?P<line>\d+),? col(?:umn)? (?P<column>\d+)")
SUMMARY = re.compile(r"^Failure: (?P<count>\d+) problems? found$")
PARSE_ERROR_RULE_ID = "parse-error"


def result(rule: str, message: str, path: str, line: int, column: int | None) -> dict:
    region = {"startLine": line}
    if column is not None:
        region["startColumn"] = column
    return {
        "ruleId": rule,
        "level": "error",
        "message": {"text": message},
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {"uri": path},
                    "region": region,
                }
            }
        ],
    }


def parse_block(path: str, lines: list[str]) -> dict:
    text = [line.strip() for line in lines if line.strip()]
    for line in text:
        position = PARSE_POSITION.search(line)
        if position:
            return result(
                PARSE_ERROR_RULE_ID,
                line,
                path,
                int(position.group("line")),
                int(position.group("column")),
            )
    message = text[0] if text else "gdlint could not parse this file"
    return result(PARSE_ERROR_RULE_ID, message, path, 1, None)


def parse(stderr: str) -> tuple[list[dict], int | None]:
    results: list[dict] = []
    summary: int | None = None
    block_path: str | None = None
    block_lines: list[str] = []

    def close_block() -> None:
        nonlocal block_path, block_lines
        if block_path is not None:
            results.append(parse_block(block_path, block_lines))
        block_path = None
        block_lines = []

    for line in stderr.splitlines():
        finding = FINDING.match(line)
        header = PARSE_HEADER.match(line)
        total = SUMMARY.match(line)
        if finding:
            close_block()
            results.append(
                result(
                    finding.group("rule"),
                    finding.group("message"),
                    finding.group("path"),
                    int(finding.group("line")),
                    None,
                )
            )
        elif header:
            close_block()
            block_path = header.group("path")
        elif total:
            close_block()
            summary = int(total.group("count"))
        elif block_path is not None:
            block_lines.append(line)
    close_block()
    return results, summary


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: gdlint_to_sarif.py <exit code>", file=sys.stderr)
        return 2

    exit_code = int(sys.argv[1])
    stderr = sys.stdin.read()
    results, summary = parse(stderr)

    if exit_code == 0 and (results or summary is not None):
        print(f"gdlint exited 0 but reported problems:\n{stderr}", file=sys.stderr)
        return 1
    if exit_code == 1 and summary != len(results):
        print(
            f"gdlint reported {summary} problems but {len(results)} were parsed:\n{stderr}",
            file=sys.stderr,
        )
        return 1
    if exit_code not in (0, 1):
        print(f"gdlint exited {exit_code}:\n{stderr}", file=sys.stderr)
        return 1

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }
    json.dump(sarif, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

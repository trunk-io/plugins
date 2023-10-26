#!/usr/bin/env python3

"""
Parser for markdown-link-check stdout.

markdown-link-check output looks like this

```
[✖] https://docs.trunk.io/docs/compatibility → Status: 404
[✖] /linters/stringslint/stringslint.test.ts → Status: 400
[✖] ../linters/sqlfluff/test/sqlfluff_test.ts → Status: 400
```
"""

import argparse
import json
import re
import sys


def try_find_string_in_file(filename, search_string):
    with open(filename, "r") as f:
        for i, line in enumerate(f):
            index = line.find(search_string)
            if index != -1:
                return i + 1, index + 1
    return 0, 0


def to_result_sarif(
    path: str, line_number: int, column_number: int, rule_id: str, message: str
):
    return {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": path,
                    },
                    "region": {
                        "startColumn": column_number,
                        "startLine": line_number,
                    },
                }
            }
        ],
        "message": {
            "text": message,
        },
        "ruleId": rule_id,
    }


def main(argv):
    parser = argparse.ArgumentParser(description="Parse output of markdown-link-check")
    parser.add_argument("--target", dest="target")
    args = parser.parse_args()

    results = []

    # Line numbers are not reported out of the tool right now - so we regex parse the output to extract issue codes
    for line in sys.stdin:
        parse_reg = "\s*(\[.*\])\s(.*)→.*Status:\s*(\d*)(.*)"
        filename = args.target

        parse_result = re.fullmatch(parse_reg, line, flags=re.DOTALL)
        if parse_result:
            bad_link = parse_result.group(2).strip()
            line, col = try_find_string_in_file(filename, bad_link)

            results.append(
                to_result_sarif(
                    ".",
                    line,
                    col,
                    parse_result.group(3),
                    bad_link,
                )
            )
        else:
            results.append(
                to_result_sarif(
                    ".",
                    0,
                    0,
                    "error",
                    line,
                )
            )

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

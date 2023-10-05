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

import json
import re
import sys


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
    results = []

    # output = sys.stdin

    # issues = output.split()

    for line in sys.stdin:
        parse_reg = "\s*(\[.*\])\s(.*)→.*Status:\s*(\d*)(.*)"

        parse_result = re.fullmatch(parse_reg, line, flags=re.DOTALL)
        if parse_result:
            results.append(
                to_result_sarif(
                    ".",
                    0,
                    0,
                    parse_result.group(3),
                    parse_result.group(2),
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

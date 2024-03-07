#!/usr/bin/env python3

import json
import re
import sys


def to_result_sarif(path: str, description: str, line: int = 0, column: int = 0):
    return {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": path,
                    },
                    "region": {
                        "startColumn": column,
                        "startLine": line,
                    },
                }
            }
        ],
        "message": {
            "text": description,
        },
        "ruleId": "SyntaxError",
    }


def main(argv):
    if len(argv) < 2:
        print("Usage: trivy_to_sarif.py <exit_code>)")
        sys.exit(1)

    if argv[1] == "0":
        results = []
        sarif = {
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "version": "2.1.0",
            "runs": [{"results": results}],
        }

        print(json.dumps(sarif, indent=2))
        sys.exit(0)

    for line in sys.stdin:
        m = re.match(r"\[error\] (.*): SyntaxError:(.*)\((\d+):(\d+)\)", line)
        if m:
            break
    else:
        print("Unexpected output from prettier")
        sys.exit(int(argv[1]))

    results = []
    results.append(to_result_sarif(m[1], m[2], int(m[3]), int(m[4])))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

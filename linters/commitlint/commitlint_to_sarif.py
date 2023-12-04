#!/usr/bin/env python3

import json
import re
import sys


def to_result_sarif(rule_id: str, message: str):
    workspace = sys.argv[-1]
    return {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": f"{workspace}/.git/COMMIT_EDITMSG",
                    },
                    "region": {
                        "startColumn": 0,
                        "startLine": 0,
                    },
                }
            }
        ],
        "message": {
            "text": message,
        },
        "ruleId": rule_id,
    }


def main():
    results = []

    for line in sys.stdin.readlines():
        pattern = r"(?P<symbol>\S+)\s+(?P<message>.+)\s\[(?P<code>.+)\]"
        match = re.match(pattern, line)

        if match:
            result = match.groupdict()
            results.append(to_result_sarif(result["code"], result["message"]))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main()

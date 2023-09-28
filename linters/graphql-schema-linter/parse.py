#!/usr/bin/env python3

import json
import sys


def to_result_sarif(path: str, lineno: int, colno: int, rule_id: str, message: str):
    return {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": path,
                    },
                    "region": {
                        "startColumn": colno,
                        "startLine": lineno,
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
    output_json = json.load(sys.stdin)
    errors = output_json.get("errors", [])
    results = []
    for error in errors:
        rule = error.get("rule", "")
        message = error.get("message", "")
        location = error.get("location")
        if location:
            path = location.get("file", "")
            line = location.get("line", 0)
            column = location.get("column", 0)
            results.append(to_result_sarif(path, line, column, rule, message))
    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }
    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

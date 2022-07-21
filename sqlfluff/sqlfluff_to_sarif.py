#!/usr/bin/env python3

import json
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
    sqlfluff_json = json.load(sys.stdin)
    results = []

    for result in sqlfluff_json:
        filepath = result["filepath"]
        for violation in result["violations"]:
            line_number = violation["line_no"]
            column_number = violation["line_pos"]
            rule_id = violation["code"]
            message = violation["description"]

            results.append(
                to_result_sarif(filepath, line_number, column_number, rule_id, message)
            )

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

#!/usr/bin/env python3

import json
import sys
from typing import Optional


def to_result_sarif(
    path: str,
    start_line_number: int,
    start_column_number: int,
    end_line_number: Optional[int],
    end_column_number: Optional[int],
    rule_id: str,
    message: str,
):
    region = {
        "startLine": start_line_number,
        "startColumn": start_column_number,
    }
    if end_line_number is not None and end_column_number is not None:
        region["endLine"] = end_line_number
        region["endColumn"] = end_column_number

    return {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": path,
                    },
                    "region": region,
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
            # In sqlfluff 3.0.0, line_no/line_pos replaced with start_*/end_*
            start_line_number = violation.get("start_line_no", violation.get("line_no"))
            start_column_number = violation.get(
                "start_line_pos", violation.get("line_pos")
            )
            end_line_number = violation.get("end_line_no")
            end_column_number = violation.get("end_line_pos")

            rule_id = violation["code"]
            message = violation["description"]

            results.append(
                to_result_sarif(
                    filepath,
                    start_line_number,
                    start_column_number,
                    end_line_number,
                    end_column_number,
                    rule_id,
                    message,
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

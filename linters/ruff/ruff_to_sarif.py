#!/usr/bin/env python3

import json
import sys

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
            {
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
        )

sarif = {
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    "version": "2.1.0",
    "runs": [{"results": results}],
}

print(json.dumps(sarif, indent=2))

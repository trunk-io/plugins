#!/usr/bin/env python3

import json
import sys


def map_severity(severity):
    if severity in ["convetion", "refactor", "info"]:
        return "note"
    if severity in ["warning"]:
        return "warning"
    if severity in ["error", "fatal"]:
        return "error"
    return "none"


results = []

for file in json.load(sys.stdin)["files"]:
    for offense in file["offenses"]:
        parse = {
            "level": map_severity(offense["severity"]),
            "locations": [
                {
                    "physicalLocation": {
                        "artifactLocation": {
                            "uri": file["path"],
                        },
                        "region": {
                            "startLine": offense["location"]["start_line"] + 1,
                            "startColumn": offense["location"]["start_column"] + 1,
                            "endLine": offense["location"]["last_line"] + 1,
                            "endColumn": offense["location"]["last_column"] + 1,
                        },
                    }
                }
            ],
            "message": {"text": offense["message"]},
            "ruleId": offense["cop_name"],
        }
        results.append(parse)

sarif = {
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    "version": "2.1.0",
    "runs": [{"results": results}],
}

print(json.dumps(sarif, indent=2))

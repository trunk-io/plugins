#!/usr/bin/env python3

import json
import sys

results = []


def get_region(entry, column_offset=0):
    location = entry["location"]
    region = {
        "startColumn": location["column"] + column_offset,
        "startLine": location["row"],
    }
    if "end_location" in entry:
        end_location = entry["end_location"]
        region["endColumn"] = end_location["column"] + column_offset
        region["endLine"] = end_location["row"]
    return region


for result in json.load(sys.stdin):
    filepath = result["filename"]
    rule_id = result["code"]
    message = result["message"]

    sarif_result = {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": filepath,
                    },
                    "region": get_region(result),
                }
            }
        ],
        "message": {
            "text": message,
        },
        "ruleId": rule_id,
    }

    if "fix" in result and result["fix"] is not None:
        fix = result["fix"]
        sarif_result["fixes"] = [
            {
                "description": {
                    "text": fix["message"],
                },
                "artifactChanges": [
                    {
                        "artifactLocation": {
                            "uri": filepath,
                        },
                        "replacements": [
                            {
                                # Ruff gives 0-indexed columns, SARIF requires 1-indexed
                                # https://github.com/charliermarsh/ruff/issues/3106
                                "deletedRegion": get_region(fix, 1),
                                "insertedContent": {
                                    "text": fix["content"],
                                },
                            }
                        ],
                    }
                ],
            }
        ]

    results.append(sarif_result)

sarif = {
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    "version": "2.1.0",
    "runs": [{"results": results}],
}

print(json.dumps(sarif, indent=2))

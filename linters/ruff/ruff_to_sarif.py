#!/usr/bin/env python3

import json
import sys

results = []


def get_region(entry):
    location = entry["location"]
    region = {
        "startColumn": location["column"] + 1,
        "startLine": location["row"],
    }
    if "end_location" in entry:
        end_location = entry["end_location"]
        region["endColumn"] = end_location["column"] + 1
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
                                "deletedRegion": get_region(fix),
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

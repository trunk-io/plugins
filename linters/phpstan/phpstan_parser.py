#!/usr/bin/env python3

import json
import sys


def main():
    phpstan_json = json.loads(sys.stdin.read())

    results = []
    for file_name in phpstan_json["files"]:
        file_result = phpstan_json["files"][file_name]
        for result in file_result["messages"]:
            result = {
                # We do not have a ruleId
                "message": {
                    "text": result["message"],
                },
                "ruleId": "phpstan",
                "level": "error",
                "locations": [
                    {
                        "physicalLocation": {
                            "artifactLocation": {"uri": file_name},
                            "region": {
                                "startLine": result["line"],
                                "startColumn": 0,  # Output column is not available in phpstan
                            },
                        }
                    },
                ],
            }
            results.append(result)

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main()

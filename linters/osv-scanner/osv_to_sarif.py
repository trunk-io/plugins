#!/usr/bin/env python3

import json
import sys


def to_result_sarif(path: str, vuln_id: str, description: str):
    return {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": path,
                    },
                    "region": {
                        "startColumn": 0,
                        "startLine": 0,
                    },
                }
            }
        ],
        "message": {
            "text": description,
        },
        "ruleId": vuln_id,
    }


def main(argv):
    osv_json = json.load(sys.stdin)
    results = osv_json.get("results", [])
    if results is None:
        results = []

    for result in results:
        if "source" not in result:
            continue
        path = result["source"]["path"]
        for package in result["packages"]:
            for vuln in package["vulnerabilities"]:
                vuln_id = vuln["id"]
                description = vuln["summary"]
                if len(description) == 0:
                    description = vuln["details"]

                results.append(to_result_sarif(path, vuln_id, description))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

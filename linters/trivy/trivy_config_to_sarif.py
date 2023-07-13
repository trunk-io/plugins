#!/usr/bin/env python3

import json
import sys


def to_result_sarif(path: str, vuln_id: str, description: str, line: int = 0):
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
                        "startLine": line,
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
    trivy_json = json.load(sys.stdin)
    results = []

    for result in trivy_json.get("Results", []):
        if "Misconfigurations" not in result:
            continue
        for vuln in result["Misconfigurations"]:
            vuln_id = vuln["ID"]
            description = vuln["Description"]
            lines = trivy_json.get("CauseMetadata", {}).get("Code", {}).get("Lines", [])
            if len(lines):
                line_num = lines[0].get("Number", 0)
            else:
                line_num = 0

            results.append(
                to_result_sarif(
                    trivy_json["ArtifactName"], vuln_id, description, line_num
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

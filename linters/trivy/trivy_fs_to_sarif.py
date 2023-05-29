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
    trivy_json = json.load(sys.stdin)
    results = []

    for result in trivy_json.get("Results", []):
        for vuln in result.get("Vulnerabilities", []):
            vuln_id = vuln["VulnerabilityID"]
            description = vuln["Description"]

            results.append(
                to_result_sarif(trivy_json["ArtifactName"], vuln_id, description)
            )

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

#!/usr/bin/env python3

import json
import os
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
    path = trivy_json["ArtifactName"]
    results = []

    for result in trivy_json.get("Results", []):
        if "Misconfigurations" not in result:
            continue
        for vuln in result["Misconfigurations"]:
            vuln_id = vuln["ID"]
            message = vuln["Message"]
            location_info = vuln.get("CauseMetadata", {})
            line_num = location_info.get("StartLine", 0)
            for occurrence in location_info.get("Occurrences", []):
                # Sometimes the original StartLine will reference a resource file
                if occurrence.get("Filename") == os.path.basename(path):
                    line_num = occurrence["Location"]["StartLine"]
                    break

            results.append(to_result_sarif(path, vuln_id, message, line_num))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

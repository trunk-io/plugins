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
    results = []
    for line in sys.stdin:
        if not line.startswith("error"):
            continue

        # example output line:
        # error - python package "myinternaltool" is available for public registration. /home/maverick/plugins/requirements.txt
        words = line.split()
        pkg_type = words[2]  # python or npm
        file = words[-1]
        msg = " ".join(words[2:-1])
        results.append(to_result_sarif(file, pkg_type, msg))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

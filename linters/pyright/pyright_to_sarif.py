#!/usr/bin/env python3

import json
import sys

results = []

for result in json.load(sys.stdin)["generalDiagnostics"]:
    parse = {
        "level": result["severity"] if result["severity"] != "information" else "note",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": result["file"],
                    },
                    "region": {
                        "startLine": result["range"]["start"]["line"]
                        + 1,  # pyright is 0-indexed, SARIF is 1-indexed
                        "startColumn": result["range"]["start"]["character"] + 1,
                        "endLine": result["range"]["end"]["line"] + 1,
                        "endColumn": result["range"]["end"]["character"] + 1,
                    },
                }
            }
        ],
        "message": {
            "text": result["message"].replace("Â", ""),
        },
    }
    if "rule" in result:
        parse["ruleId"] = result["rule"]
    results.append(parse)

sarif = {
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    "version": "2.1.0",
    "runs": [{"results": results}],
}

print(json.dumps(sarif, indent=2))

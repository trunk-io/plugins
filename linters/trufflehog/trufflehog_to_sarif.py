#!/usr/bin/env python3

import json
import os
import sys


def to_result_sarif(path: str, line_number: int, vuln_id: str, description: str):
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
                        "startLine": line_number,
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

    for line in sys.stdin.readlines():
        vuln_json = json.loads(line)

        # trufflehog doesn't have vuln IDs
        # this is the name of the detector that found the error (e.g. AWS, Github, PrivateKey)
        vuln_id = vuln_json["DetectorName"]

        # There also isn't description of the error aside from the raw secret, the redacted secret,
        # and the detector that found it.
        #
        # This default is here because Github secrets (and possibly others) redact to an empty string.
        if vuln_json["Redacted"]:
            description = "Secret detected: " + vuln_json["Redacted"]
        else:
            description = "Secret detected"

        if "Filesystem" in vuln_json["SourceMetadata"]["Data"]:
            path = vuln_json["SourceMetadata"]["Data"]["Filesystem"]["file"]
            line_number = (
                int(vuln_json["SourceMetadata"]["Data"]["Filesystem"].get("line", "0"))
                + 1
            )
        elif "Git" in vuln_json["SourceMetadata"]["Data"]:
            file = vuln_json["SourceMetadata"]["Data"]["Git"]["file"]
            line = vuln_json["SourceMetadata"]["Data"]["Git"]["line"]
            commit = vuln_json["SourceMetadata"]["Data"]["Git"]["commit"]
            if os.path.exists(file):
                description = "{} on commit {}".format(
                    description,
                    commit,
                )
                path = file
                line_number = line
            else:
                description = "{}:{}: {} on commit {} (file since deleted)".format(
                    file,
                    line,
                    description,
                    commit,
                )
                path = "."
                line_number = 0
        else:
            raise Exception(
                "Unknown source metadata: {}".format(vuln_json["SourceMetadata"])
            )

        results.append(to_result_sarif(path, line_number, vuln_id, description))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

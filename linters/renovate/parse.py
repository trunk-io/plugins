#!/usr/bin/env python3

"""
renovate-config-validae output looks like this:

```
INFO: Validating renovate.json
ERROR: renovate.json contains errors
       "errors": [
         {
           "topic": "Configuration Error",
           "message": "Invalid configuration option: packageRules[0].matchUpdateTypesd"
         }
       ]
```
"""

import json
import sys


def to_result_sarif(
    path: str, line_number: int, column_number: int, rule_id: str, message: str
):
    return {
        "level": "error",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": path,
                    },
                    "region": {
                        "startColumn": column_number,
                        "startLine": line_number,
                    },
                }
            }
        ],
        "message": {
            "text": message,
        },
        "ruleId": rule_id,
    }


def main(argv):
    results = []
    content = sys.stdin.read()
    error_section = content.find('"errors": [')
    if error_section == -1:
        # could not parse - dumping all content as the error
        results.append(to_result_sarif(".", 0, 0, "error", content))
    else:

        # Parse the output as json

        json_content = "{" + content[error_section:] + "}"
        error_output = json.loads(json_content)
        for entry in error_output.get("errors", []):
            results.append(to_result_sarif(".", 0, 0, entry["topic"], entry["message"]))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

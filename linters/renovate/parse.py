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

Bad JSON parses like this
```
WARN: linters/renovate/test_data/bad_renovate.json could not be parsed
    "err": {
        "lineNumber": 12,
        "columnNumber": 1,
        "message": "JSON5: invalid end of input at 12:1",
        "stack": "SyntaxError: JSON5: invalid end of input at 12:1\n    at syntaxError (/home/eli/.cache/trunk/tools/renovate/34.122.0-55cc21ab9187b50133f5b632efea6883/node_modules/json5/lib/parse.js:1110:17)\n    at invalidEOF (/home/eli/.cache/trunk/tools/renovate/34.122.0-55cc21ab9187b50133f5b632efea6883/node_modules/json5/lib/parse.js:1059:12)\n    at Object.afterPropertyValue (/home/eli/.cache/trunk/tools/renovate/34.122.0-55cc21ab9187b50133f5b632efea6883/node_modules/json5/lib/parse.js:915:19)\n    at Object.parse (/home/eli/.cache/trunk/tools/renovate/34.122.0-55cc21ab9187b50133f5b632efea6883/node_modules/json5/lib/parse.js:32:32)\n    at getParsedContent (/home/eli/.cache/trunk/tools/renovate/34.122.0-55cc21ab9187b50133f5b632efea6883/node_modules/renovate/lib/workers/global/config/parse/file.ts:20:20)\n    at /home/eli/.cache/trunk/tools/renovate/34.122.0-55cc21ab9187b50133f5b632efea6883/node_modules/renovate/lib/config-validator.ts:62:31"
    }
```
"""

import json
import re
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

    parse_reg = "(.*WARN:.*could not be parsed)(.*)"
    error_section = content.find('"errors": [')

    parse_result = re.fullmatch(parse_reg, content, flags=re.DOTALL)
    if parse_result:
        warn_section = parse_result.group(2)
        json_content = "{" + warn_section + "}"
        error_output = json.loads(json_content)
        err = error_output.get("err")
        results.append(
            to_result_sarif(
                ".", err["lineNumber"], err["columnNumber"], "JSON", err["message"]
            )
        )
        pass
    # TODO - fix this up to read the exit code once that is available in the parser
    elif content.find("Config validated successfully") != -1:
        pass
    elif error_section == -1:
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

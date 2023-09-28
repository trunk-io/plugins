#!/usr/bin/env python3

"""
remark output looks like this:

```
[{
	"path": "linters/remark-lint/test_data/basic.in.md",
	"cwd": "/tmp/trunk-1001/OA3KSD",
	"history": ["linters/remark-lint/test_data/basic.in.md"],
	"messages": [{
		"reason": "Use spaces instead of tabs",
		"line": 13,
		"column": 5,
		"position": {
			"start": {
				"line": 13,
				"column": 5,
				"offset": 159
			},
			"end": {
				"line": null,
				"column": null
			}
		},
		"ruleId": "no-tabs",
		"source": "remark-lint",
		"fatal": false,
		"stack": null,
		"url": "https://github.com/remarkjs/remark-lint/tree/main/packages/remark-lint-no-tabs#readme"
	}]
}]
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
    content_json = sys.stdin.read()
    content = json.loads(content_json)
    for file_content in content:
        messages = file_content.get("messages", [])
        if messages:
            for msg in messages:
                results.append(
                    to_result_sarif(
                        ".", msg["line"], msg["column"], msg["ruleId"], msg["reason"]
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

#!/usr/bin/env python3

"""
nancy sleuth --output=json looks like this:

```
{
  ...,
  "vulnerable": [
    {
      "Coordinates": "pkg:golang/golang.org/x/text@v0.3.7",
      "Reference": "https://ossindex.sonatype.org/component/pkg:golang/golang.org/x/text@v0.3.7?utm_source=nancy-client&utm_medium=integration&utm_content=1.0.41",
      "Vulnerabilities": [
        {
          "ID": "CVE-2022-32149",
          "Title": "[CVE-2022-32149] CWE-400: Uncontrolled Resource Consumption ('Resource Exhaustion')",
          "Description": "An attacker may cause a denial of service by crafting an Accept-Language header which ParseAcceptLanguage will take significant time to parse.",
          "CvssScore": "7.5",
          "CvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
          "Cve": "CVE-2022-32149",
          "Reference": "https://ossindex.sonatype.org/vulnerability/CVE-2022-32149?component-type=golang&component-name=golang.org%2Fx%2Ftext&utm_source=nancy-client&utm_medium=integration&utm_content=1.0.41",
          "Excluded": false
        }
      ],
      "InvalidSemVer": false
    }
  ]
}
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

    nancy_output = json.load(sys.stdin)

    for vuln_entry in nancy_output.get("vulnerable", []):
        for vuln in vuln_entry.get("Vulnerabilities", []):
            results.append(
                to_result_sarif(
                    ".",
                    0,
                    0,
                    vuln["ID"],
                    f'{vuln_entry["Coordinates"]} is vulnerable: {vuln["Description"]}',
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

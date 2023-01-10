#!/bin/bash

cat <<EOF
{
  "\$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "results": [
        {
          "level": "error",
          "ruleId": "SlevomatCodingStandard.TypeHints.DeclareStrictTypes.DeclareStrictTypesMissing",
          "rank": 5,
          "message": {
            "text": "Missing declare(strict_types = 1)."
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "pathToProject/Commands/ExampleCommand.php"
                },
                "region": {
                  "startColumn": 1,
                  "startLine": 1
                }
              }
            }
          ]
        }
      ],
      "tool": {
        "driver": {
          "name": "phpcs"
        }
      }
    }
  ]
}
EOF

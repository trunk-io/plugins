#!/usr/bin/env python3

# trunk-ignore-begin(ruff)
"""
as of 1.28.2, sarif output looks like this
======================================================
tfsec is joining the Trivy family

tfsec will continue to remain available
for the time being, although our engineering
attention will be directed at Trivy going forward.
You can read more here:
https://github.com/aquasecurity/tfsec/discussions/1994
======================================================
{
  "version": "2.1.0",
  ...
"""
# trunk-ignore-end(ruff)

import json
import re
import sys


def extract_json(original_input):
    try:
        json_obj = json.loads(original_input)
        return json.dumps(json_obj), True
    except ValueError:
        index = original_input.find("{")
        if index != -1:
            return original_input[index:], True
        else:
            return original_input, False


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


def extract_error_to_sarif(input_str):
    # Example output from tfsec to parse with regex
    r"""
    Error: scan failed: home/kohkubo/GitHub/review/akuma_review/terraform/modules/cloud_run/main.tf:19,25-20,1: Invalid multi-line string; Quoted strings may not be split over multiple lines. To produce a multi-line string, either use the \n escape to represent a newline character or use the "heredoc" multi-line template syntax., and 54 other diagnostic(s).
    """

    match = re.match(r"^Error: scan failed: (.+\.tf):(\d+),(\d+).*: (.+)$", input_str)
    if not match:
        return input_str

    filename = match.group(1)
    line = match.group(2)
    col = match.group(3)
    error_context = match.group(4)

    results = [to_result_sarif(filename, line, col, "malformed", error_context)]

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }
    return json.dumps(sarif, indent=2)


def main():
    original_input = sys.stdin.read()
    extracted_json, has_json = extract_json(original_input)

    if has_json:
        print(extracted_json)
    else:
        print(extract_error_to_sarif)


if __name__ == "__main__":
    main()

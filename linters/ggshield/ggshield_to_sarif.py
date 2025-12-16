#!/usr/bin/env python3

import json
import os
import sys


def to_result_sarif(path: str, line_number: int, rule_id: str, description: str):
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
        "ruleId": rule_id,
    }


def main(argv):
    try:
        ggshield_json = json.load(sys.stdin)
    except json.JSONDecodeError:
        # If no JSON output or empty output, return empty SARIF
        sarif = {
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "version": "2.1.0",
            "runs": [{"results": []}],
        }
        print(json.dumps(sarif, indent=2))
        return

    results = []

    # ggshield JSON structure can vary, handle different possible formats
    # Common structure: {"entities_with_incidents": [...]} or {"results": [...]}
    incidents = []

    if "entities_with_incidents" in ggshield_json:
        # Format: {"entities_with_incidents": [{"filename": "...", "incidents": [...]}]}
        for entity in ggshield_json.get("entities_with_incidents", []):
            filename = entity.get("filename", "")
            for incident in entity.get("incidents", []):
                incidents.append(
                    {
                        "path": filename,
                        "line": incident.get("line", 0),
                        "type": incident.get("type", "Secret"),
                        "match": incident.get("match", ""),
                        "index_start": incident.get("index_start", 0),
                        "index_end": incident.get("index_end", 0),
                    }
                )
    elif "results" in ggshield_json:
        # Alternative format: {"results": [...]}
        for result in ggshield_json.get("results", []):
            filename = result.get("filename", result.get("path", ""))
            for incident in result.get("incidents", []):
                incidents.append(
                    {
                        "path": filename,
                        "line": incident.get("line", incident.get("line_number", 0)),
                        "type": incident.get(
                            "type", incident.get("detector_name", "Secret")
                        ),
                        "match": incident.get("match", incident.get("secret", "")),
                        "index_start": incident.get("index_start", 0),
                        "index_end": incident.get("index_end", 0),
                    }
                )
    elif isinstance(ggshield_json, list):
        # Format: [{...}, {...}]
        for item in ggshield_json:
            if "filename" in item or "path" in item:
                filename = item.get("filename", item.get("path", ""))
                for incident in item.get("incidents", []):
                    incidents.append(
                        {
                            "path": filename,
                            "line": incident.get("line", 0),
                            "type": incident.get("type", "Secret"),
                            "match": incident.get("match", ""),
                            "index_start": incident.get("index_start", 0),
                            "index_end": incident.get("index_end", 0),
                        }
                    )

    # Process incidents and create SARIF results
    for incident in incidents:
        path = incident.get("path", "")
        line_number = incident.get("line", 0)
        rule_id = incident.get("type", "Secret")
        match = incident.get("match", "")

        # Create description
        if match:
            # Redact the secret for display
            if len(match) > 20:
                redacted = match[:10] + "..." + match[-5:]
            else:
                redacted = "***REDACTED***"
            description = f"Secret detected ({rule_id}): {redacted}"
        else:
            description = f"Secret detected ({rule_id})"

        # Normalize path to be relative to workspace
        if path and os.path.isabs(path):
            # Try to make it relative if possible
            pass

        results.append(to_result_sarif(path, line_number, rule_id, description))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

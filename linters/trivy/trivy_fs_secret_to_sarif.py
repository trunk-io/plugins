#!/usr/bin/env python3

import json
import sys

# Used to map OSV/GHSA severities to the corresponding SARIF severity
# OSV/GHSA: https://docs.github.com/en/code-security/security-advisories/global-security-advisories/about-the-github-advisory-database#about-cvss-levels
# SARIF: https://docs.oasis-open.org/sarif/sarif/v2.0/csprd02/sarif-v2.0-csprd02.html#_Toc10127839
SARIF_SEVERITY_BY_OSV_SEVERITY = {
    "CRITICAL": "error",
    "HIGH": "error",
    "MODERATE": "warning",
    "MEDIUM": "warning",
    "LOW": "note",
}

DEFAULT_SARIF_SEVERITY = "error"


def get_sarif_severity(secret) -> str:
    """Get the SARIF severity appropriate for a given OSV vulnerability entry."""
    if "Severity" not in secret:
        return DEFAULT_SARIF_SEVERITY

    severity = secret["Severity"].upper()

    return SARIF_SEVERITY_BY_OSV_SEVERITY.get(severity, DEFAULT_SARIF_SEVERITY)


def to_result_sarif(path: str, severity: str, code: str, description: str, lineno: int):
    return {
        "level": severity,
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {
                        "uri": path,
                    },
                    "region": {
                        "startColumn": 0,
                        "startLine": lineno,
                    },
                }
            }
        ],
        "message": {
            "text": description,
        },
        "ruleId": code,
    }


def main(argv):
    trivy_json = json.load(sys.stdin)
    results = []

    for result in trivy_json.get("Results", []):
        path = trivy_json["ArtifactName"]
        for secret in result.get("Secrets", []):
            code = secret["RuleID"]
            description = secret["Title"]
            lineno = secret.get("StartLine", 0)

            results.append(
                to_result_sarif(
                    path,
                    get_sarif_severity(secret),
                    code,
                    description,
                    lineno,
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

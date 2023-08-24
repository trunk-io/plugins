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


def get_sarif_severity(vuln) -> str:
    """Get the SARIF severity appropriate for a given OSV vulnerability entry."""
    if "Severity" not in vuln:
        return DEFAULT_SARIF_SEVERITY

    severity = vuln["Severity"].upper()

    return SARIF_SEVERITY_BY_OSV_SEVERITY.get(severity, DEFAULT_SARIF_SEVERITY)


def to_result_sarif(
    path: str, severity: str, vuln_id: str, description: str, lineno: int
):
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
        "ruleId": vuln_id,
    }


def main(argv):
    trivy_json = json.load(sys.stdin)
    results = []
    lockfiles = {}

    for result in trivy_json.get("Results", []):
        for vuln in result.get("Vulnerabilities", []):
            pkg_name = vuln["PkgName"]
            path = trivy_json["ArtifactName"]
            vuln_id = vuln["VulnerabilityID"]
            description = vuln["Title"]
            current_version = vuln["InstalledVersion"]
            fixed_version = vuln.get("FixedVersion", None)

            if path not in lockfiles:
                lockfiles[path] = open(path).read().splitlines()

            if description[-1] != ".":
                description += "."

            message = f"Vulnerability in '{pkg_name}': {description} Current version is vulnerable: {current_version}."
            if fixed_version:
                message += f" Patch available: upgrade to {fixed_version} or higher."

            lineno = 0
            for num, line in enumerate(lockfiles[path], 1):
                if pkg_name in line and current_version in line:
                    lineno = num
                    break

            results.append(
                to_result_sarif(
                    path,
                    get_sarif_severity(vuln),
                    vuln_id,
                    message,
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

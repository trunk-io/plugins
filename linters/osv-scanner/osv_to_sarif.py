#!/usr/bin/env python3

import json
import re
import sys
from itertools import pairwise

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
    if "database_specific" not in vuln:
        return DEFAULT_SARIF_SEVERITY

    vuln_metadata = vuln["database_specific"]

    if "severity" not in vuln_metadata:
        return DEFAULT_SARIF_SEVERITY

    severity = vuln_metadata["severity"].upper()

    return SARIF_SEVERITY_BY_OSV_SEVERITY.get(severity, DEFAULT_SARIF_SEVERITY)


def to_result_sarif(
    path: str, lineno: int, vuln_id: str, description: str, severity: str
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


def join_common_sets(lst):
    init_len = 0
    final_len = 1
    while init_len != final_len:
        init_len = len(lst)
        ret = []
        for s in lst:
            unique = True
            for stored_set in ret:
                if len(stored_set.intersection(s)) > 0:
                    stored_set.update(s)
                    unique = False
                    break
            if unique:
                ret.append(s)

        final_len = len(ret)
        lst = list(ret)
    return ret


PREFERRED_ORDER = ["GHSA-.*", "CVE-.*", "PYSEC-.*"]


def get_preferred_alias(aliases):
    for rx in PREFERRED_ORDER:
        found_aliases = sorted(alias for alias in aliases if re.match(rx, alias))
        if len(found_aliases) > 0:
            return found_aliases[0]
    return sorted(aliases)[0]


def main(argv):
    try:
        # On Windows, Unicode characters in the osv-scanner output cause json parsing errors. Filter them out since we don't care about their fields.
        if sys.platform == "win32":
            filtered_stdin = "".join(i for i in sys.stdin.read() if ord(i) < 256)
            osv_json = json.loads(filtered_stdin)
        else:
            osv_json = json.load(sys.stdin)
    except json.decoder.JSONDecodeError as err:
        if str(err) == "Expecting value: line 1 column 1 (char 0)":
            osv_json = {"results": []}
        else:
            raise err
    results = osv_json.get("results", [])

    deduped_issues = []
    lockfiles = {}

    for result in results:
        if "source" not in result:
            continue
        path = result["source"]["path"]

        # path is an absolute path, so this should always be safe
        if path not in lockfiles:
            lockfiles[path] = open(path).read().splitlines()

        for pkg_vulns in result["packages"]:
            pkg = pkg_vulns["package"]
            pkg_version = pkg["version"]
            issues_dict = {}
            aliases = []
            for vuln in pkg_vulns["vulnerabilities"]:
                vuln_id = vuln["id"]
                # <=1.34.0: summaries could have empty text
                # >=1.35.0: summaries with empty text were removed
                if "summary" in vuln and len(vuln["summary"]) > 0:
                    message = vuln["summary"]
                else:
                    message = vuln["details"]

                # Put single quotes around package names to clarify that it's a package,
                # but not if it's part of a bigger string
                # e.g. the package "golang.org/x/sys" should not get quoted in the string "golang.org/x/sys/unix"
                message = re.sub(
                    f'(^|\s)({pkg["name"]})($|\s)',
                    r"\1'\2'\3",
                    message,
                    flags=re.IGNORECASE,
                )

                has_version = False
                versions = {}
                affected = vuln.get("affected", [])
                for affected_pkg in affected:
                    if pkg["name"].lower() != affected_pkg["package"]["name"].lower():
                        continue
                    ranges = affected_pkg.get("ranges", [])
                    for r in ranges:
                        # ECOSYSTEM is the package versions
                        if r.get("type", "") != "ECOSYSTEM":
                            continue

                        has_version = True
                        for event in r["events"]:
                            versions.update(event)
                    if has_version:
                        break

                fixed_version = versions.get("fixed", None)

                quoted_name = f" of '{pkg['name']}'"
                description = f"{message}{'.' if message[-1] != '.' else ''} Current version{'' if pkg['name'] in message else quoted_name} is vulnerable: {pkg_version}."
                if fixed_version:
                    description += (
                        f" Patch available: upgrade to {fixed_version} or higher."
                    )

                lineno = 0
                for num, (line, nextline) in enumerate(
                    pairwise(lockfiles[path] + [""]), 1
                ):
                    if pkg["name"] in line and (
                        pkg["version"] in line or pkg["version"] in nextline
                    ):
                        lineno = num
                        break
                alias_set = set(vuln.get("aliases", [])) | {vuln_id}

                for alias in alias_set:
                    issues_dict[alias] = to_result_sarif(
                        path, lineno, alias, description, get_sarif_severity(vuln)
                    )
                aliases.append(alias_set)

            aliases = join_common_sets(aliases)
            for alias_set in aliases:
                deduped_issues.append(issues_dict[get_preferred_alias(alias_set)])

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": deduped_issues}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

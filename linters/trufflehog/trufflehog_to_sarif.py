#!/usr/bin/env python3

import collections
import json
import os
import sys
from itertools import islice


def to_result_sarif(path: str, line_number: int, vuln_id: str, description: str):
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
        "ruleId": vuln_id,
    }


def sliding_window(iterable, n):
    # sliding_window('ABCDEFG', 4) --> ABCD BCDE CDEF DEFG
    it = iter(iterable)
    window = collections.deque(islice(it, n - 1), maxlen=n)
    for x in it:
        window.append(x)
        yield tuple(window)


secret_lineno_cache = {}
file_cache = {}


def find_line_number(secret, path):
    if path not in file_cache:
        file_cache[path] = open(path).readlines()

    if secret not in secret_lineno_cache:
        secret_lineno_cache[secret] = []

    secret_length = len(secret.splitlines())
    lines = file_cache[path]

    for lineno, window in enumerate(sliding_window(lines, secret_length), 1):
        # trufflehog can report the same secret multiple times
        # if it truly appears multiple times, then we want to log different lines for each issue
        if lineno in secret_lineno_cache[secret]:
            continue
        if secret in "".join(window):
            secret_lineno_cache[secret].append(lineno)
            return lineno
    return None


def main(argv):
    results = []

    for line in sys.stdin.readlines():
        vuln_json = json.loads(line)

        # trufflehog doesn't have vuln IDs
        # this is the name of the detector that found the error (e.g. AWS, Github, PrivateKey)
        vuln_id = vuln_json["DetectorName"]

        # There also isn't description of the error aside from the raw secret, the redacted secret,
        # and the detector that found it.
        #
        # This default is here because Github secrets (and possibly others) redact to an empty string.
        if vuln_json["Redacted"]:
            description = "Secret detected: " + vuln_json["Redacted"]
        else:
            description = "Secret detected"

        if "Filesystem" in vuln_json["SourceMetadata"]["Data"]:
            secret = vuln_json["Raw"]
            path = vuln_json["SourceMetadata"]["Data"]["Filesystem"]["file"]
            line_number = find_line_number(secret, path)
            # trufflehog can report the same secret multiple times
            # if the line number is None, then we've already logged this secret
            if line_number is None:
                continue
        elif "Git" in vuln_json["SourceMetadata"]["Data"]:
            file = vuln_json["SourceMetadata"]["Data"]["Git"]["file"]
            line = vuln_json["SourceMetadata"]["Data"]["Git"]["line"]
            commit = vuln_json["SourceMetadata"]["Data"]["Git"]["commit"]
            if os.path.exists(file):
                description = "{} on commit {}".format(
                    description,
                    commit,
                )
                path = file
                line_number = line
            else:
                description = "{}:{}: {} on commit {} (file since deleted)".format(
                    file,
                    line,
                    description,
                    commit,
                )
                path = "."
                line_number = 0
        else:
            raise Exception(
                "Unknown source metadata: {}".format(vuln_json["SourceMetadata"])
            )

        results.append(to_result_sarif(path, line_number, vuln_id, description))

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"results": results}],
    }

    print(json.dumps(sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

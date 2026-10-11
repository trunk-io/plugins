#!/usr/bin/env python3
"""Resolve jscpd SARIF locations to absolute paths.

jscpd runs once on the whole workspace (see run.sh) and writes artifact URIs relative to
the scan root, with the root itself in `originalUriBaseIds` (`%SRCROOT%`). trunk resolves
relative URIs against the linter's sandbox directory, which is empty for a `target: .`
linter, so the results would be discarded. Join each URI with its base to make it absolute.
"""

import json
import sys
from urllib.parse import unquote, urlparse


def base_paths(run):
    bases = {}
    for key, value in run.get("originalUriBaseIds", {}).items():
        uri = value.get("uri", "")
        parsed = urlparse(uri)
        path = unquote(parsed.path) if parsed.scheme == "file" else uri
        bases[key] = path if path.endswith("/") else path + "/"
    return bases


def absolutize_artifact(artifact, bases):
    base = bases.get(artifact.get("uriBaseId", ""))
    uri = unquote(artifact.get("uri", ""))
    if base and not uri.startswith("/"):
        artifact["uri"] = base + uri
    artifact.pop("uriBaseId", None)
    # trunk prefers the `artifacts` entry an `index` points to; those are rewritten too,
    # but drop the index so the inline URI is authoritative.
    artifact.pop("index", None)


def absolutize(location, bases):
    artifact = location.get("physicalLocation", {}).get("artifactLocation")
    if artifact:
        absolutize_artifact(artifact, bases)


def main():
    sarif = json.load(sys.stdin)
    for run in sarif.get("runs", []):
        bases = base_paths(run)
        for artifact in run.get("artifacts", []):
            if "location" in artifact:
                absolutize_artifact(artifact["location"], bases)
        for result in run.get("results", []):
            for location in result.get("locations", []):
                absolutize(location, bases)
            for location in result.get("relatedLocations", []):
                absolutize(location, bases)
    json.dump(sarif, sys.stdout)


if __name__ == "__main__":
    main()

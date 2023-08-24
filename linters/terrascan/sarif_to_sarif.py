#!/usr/bin/env python3

import json
import sys


def main(argv):
    input_sarif = json.load(sys.stdin)

    # strip "file:" from the beginning of each value in the 'file' field in the 'location' object in sarif format
    for run in input_sarif["runs"]:
        for result in run["results"]:
            for location in result["locations"]:
                location["physicalLocation"]["artifactLocation"]["uri"] = location[
                    "physicalLocation"
                ]["artifactLocation"]["uri"][5:]

    print(json.dumps(input_sarif, indent=2))


if __name__ == "__main__":
    main(sys.argv)

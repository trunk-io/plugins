#!/usr/bin/env python3

import os
import sys

DEFAULT_LENGTH = 100


def get_length(workspace):
    config_file = workspace + "/.ation"
    if not os.path.exists(config_file):
        return DEFAULT_LENGTH
    with open(config_file) as f:
        return int(f.readline())


if __name__ == "__main__":
    line_length = get_length(os.getcwd())

    out = ""
    for line in sys.stdin:
        replacement = line.replace("bad code", "good code")[:line_length]
        if replacement[-1] == "\n":
            out += replacement
        else:
            out += replacement + "\n"

    print(out[:-1])

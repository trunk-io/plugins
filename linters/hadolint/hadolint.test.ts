import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// We have a number of different files to determine which are valid Dockerfiles, validated by lint actions in the snapshot
customLinterCheckTest({ linterName: "hadolint", args: TEST_DATA });

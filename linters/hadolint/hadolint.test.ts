import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

const manualVersionReplacer = (version: string) => {
  if (version === "2.12.0") {
    // This version may segfault on certain versions on macOS.
    // The beta version is identical except with upx compression disabled on the binary.
    // See https://github.com/hadolint/hadolint/issues/919#issuecomment-1672031271
    return "2.12.1-beta";
  }
  return version;
};

// We have a number of different files to determine which are valid Dockerfiles, validated by lint actions in the snapshot
customLinterCheckTest({ linterName: "hadolint", args: TEST_DATA, manualVersionReplacer });

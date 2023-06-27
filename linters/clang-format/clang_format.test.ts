import { linterFmtTest } from "tests";
import { skipOS } from "tests/utils";

// TODO(Tyler): Add .clang-format file from configs
// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and other autofixes.
linterFmtTest({ linterName: "clang-format", skipTestIf: skipOS(["win32"]) });

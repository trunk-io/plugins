import { linterFmtTest } from "tests";

// TODO(Tyler): Add .clang-format file from configs
// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and other autofixes.
linterFmtTest({ linterName: "clang-format" });

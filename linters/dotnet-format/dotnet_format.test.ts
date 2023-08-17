import { linterFmtTest } from "tests";

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterFmtTest({ linterName: "dotnet-format", namedTestPrefixes: ["basic"] });

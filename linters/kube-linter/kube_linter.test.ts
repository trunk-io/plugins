import { linterCheckTest } from "tests";
import { osTimeoutMultiplier } from "tests/utils";

jest.setTimeout(600000 * osTimeoutMultiplier); // 300s or 900s

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterCheckTest({ linterName: "kube-linter" });

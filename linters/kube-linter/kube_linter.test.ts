import { linterCheckTest } from "tests";
import { osTimeoutMultiplier } from "tests/utils";

jest.setTimeout(900000 * osTimeoutMultiplier);

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterCheckTest({ linterName: "kube-linter" });

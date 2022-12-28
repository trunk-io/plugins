import { linterCheckTest } from "tests";

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and other packages.
linterCheckTest({ linterName: "flake8" });

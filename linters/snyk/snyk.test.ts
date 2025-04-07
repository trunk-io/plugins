import { linterCheckTest } from "tests";

// Requires SNYK_TOKEN to run
linterCheckTest({ linterName: "snyk" });

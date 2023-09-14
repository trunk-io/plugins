import { customLinterCheckTest } from "tests";
customLinterCheckTest({ linterName: "tfsec", args: "-a", testName: "basic" });

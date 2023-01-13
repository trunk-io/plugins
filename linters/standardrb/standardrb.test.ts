import { customLinterCheckTest } from "tests";

// Ruby build is quite slow on Mac, so only run tests on linux for now
customLinterCheckTest({ linterName: "standardrb", args: "-a", exclusiveOS: ["linux"] });

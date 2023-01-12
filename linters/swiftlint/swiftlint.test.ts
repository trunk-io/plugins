import { customLinterCheckTest } from "tests";

customLinterCheckTest({ linterName: "swiftlint", args: "-a", exclusiveOS: ["darwin"] });

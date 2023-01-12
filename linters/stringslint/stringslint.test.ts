import { customLinterCheckTest } from "tests";

// This is a Mac-exclusive linter
customLinterCheckTest({ linterName: "stringslint", args: "-a", exclusiveOS: ["darwin"] });
